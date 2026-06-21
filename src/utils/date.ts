import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'
import type { Weekday, HiatusRecord, UpdateSchedule } from '@/types/comic'

dayjs.extend(weekday)
dayjs.extend(isoWeek)
dayjs.extend(isBetween)

export const getCurrentWeekday = (): Weekday => {
  const day = dayjs().isoWeekday()
  return day as Weekday
}

export const getWeekdayName = (day: Weekday): string => {
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return names[day - 1]
}

export const getWeekDates = (): Array<{ date: dayjs.Dayjs; weekday: Weekday; isToday: boolean }> => {
  const today = dayjs()
  const monday = today.startOf('isoWeek')
  const dates = []

  for (let i = 0; i < 7; i++) {
    const date = monday.add(i, 'day')
    dates.push({
      date,
      weekday: (i + 1) as Weekday,
      isToday: date.isSame(today, 'day')
    })
  }

  return dates
}

export const formatDate = (date: dayjs.Dayjs, format = 'MM月DD日'): string => {
  return date.format(format)
}

export const formatDateByStr = (dateStr: string, format = 'MM月DD日'): string => {
  return dayjs(dateStr).format(format)
}

export const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format('MM月DD日 HH:mm')
}

export const formatTime = (time: string): string => {
  return time
}

export const getWeekKey = (date: dayjs.Dayjs = dayjs()): string => {
  return `${date.isoWeekYear()}-W${date.isoWeek()}`
}

export const isSameWeek = (weekKey1: string, weekKey2: string): boolean => {
  return weekKey1 === weekKey2
}

export const addWeeks = (weekKey: string, weeks: number): string => {
  const [year, weekStr] = weekKey.split('-W')
  const weekNum = parseInt(weekStr, 10)
  const date = dayjs()
    .isoWeekYear(parseInt(year, 10))
    .isoWeek(weekNum)
    .add(weeks, 'week')
  return getWeekKey(date)
}

export const getTomorrowWeekday = (): Weekday => {
  const tomorrow = dayjs().add(1, 'day')
  return tomorrow.isoWeekday() as Weekday
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export interface HiatusStatus {
  isOnHiatus: boolean
  resumesTomorrow: boolean
  startDate: string | null
  endDate: string | null
  resumeDate: string | null
}

export const getHiatusStatus = (records: HiatusRecord[], comicWeekday: Weekday): HiatusStatus => {
  const today = dayjs()
  const tomorrow = dayjs().add(1, 'day')

  for (const record of records) {
    const [year, weekStr] = record.startWeek.split('-W')
    const weekNum = parseInt(weekStr, 10)

    const startOfStartWeek = dayjs()
      .isoWeekYear(parseInt(year, 10))
      .isoWeek(weekNum)
      .startOf('isoWeek')

    const firstMissedUpdate = startOfStartWeek.isoWeekday(comicWeekday)
    const resumeDate = firstMissedUpdate.add(record.weeksCount * 7, 'day').startOf('day')
    const lastHiatusDay = resumeDate.subtract(1, 'day').endOf('day')

    if (today.isBefore(resumeDate) && today.isAfter(firstMissedUpdate.subtract(1, 'day').endOf('day'))) {
      return {
        isOnHiatus: !today.isSame(resumeDate, 'day'),
        resumesTomorrow: tomorrow.isSame(resumeDate, 'day'),
        startDate: firstMissedUpdate.format('YYYY-MM-DD'),
        endDate: lastHiatusDay.format('YYYY-MM-DD'),
        resumeDate: resumeDate.format('YYYY-MM-DD')
      }
    }
  }

  return {
    isOnHiatus: false,
    resumesTomorrow: false,
    startDate: null,
    endDate: null,
    resumeDate: null
  }
}

export const isComicOnHiatusByDate = (
  records: HiatusRecord[],
  comicWeekday: Weekday,
  targetDate: dayjs.Dayjs
): boolean => {
  for (const record of records) {
    const [year, weekStr] = record.startWeek.split('-W')
    const weekNum = parseInt(weekStr, 10)

    const startOfStartWeek = dayjs()
      .isoWeekYear(parseInt(year, 10))
      .isoWeek(weekNum)
      .startOf('isoWeek')

    const firstMissedUpdate = startOfStartWeek.isoWeekday(comicWeekday)
    const resumeDate = firstMissedUpdate.add(record.weeksCount * 7, 'day').startOf('day')
    const lastHiatusDay = resumeDate.subtract(1, 'day').endOf('day')

    if (targetDate.isBetween(firstMissedUpdate.subtract(1, 'second'), lastHiatusDay.add(1, 'second'))) {
      return true
    }
  }
  return false
}

export const isScheduledToUpdate = (
  schedule: UpdateSchedule,
  targetDate: dayjs.Dayjs
): boolean => {
  const targetWeekday = targetDate.isoWeekday() as Weekday

  switch (schedule.type) {
    case 'weekly':
      return schedule.weekday === targetWeekday

    case 'biweekly': {
      if (schedule.weekday !== targetWeekday) return false
      const weekNum = targetDate.isoWeek()
      const isOddWeek = weekNum % 2 === 1
      return schedule.biweekOdd ? isOddWeek : !isOddWeek
    }

    case 'monthly': {
      return schedule.monthDay === targetDate.date()
    }

    case 'special': {
      const dateStr = targetDate.format('YYYY-MM-DD')
      return schedule.specialDates?.includes(dateStr) ?? false
    }

    default:
      return false
  }
}

export const getNextUpdateDate = (schedule: UpdateSchedule): dayjs.Dayjs | null => {
  const today = dayjs().startOf('day')

  switch (schedule.type) {
    case 'weekly': {
      const todayWeekday = today.isoWeekday() as Weekday
      const daysDiff = ((schedule.weekday ?? 1) - todayWeekday + 7) % 7
      return today.add(daysDiff, 'day')
    }

    case 'biweekly': {
      let date = today
      for (let i = 0; i < 30; i++) {
        date = today.add(i, 'day')
        if (isScheduledToUpdate(schedule, date)) {
          return date
        }
      }
      return null
    }

    case 'monthly': {
      const day = schedule.monthDay ?? 1
      let nextDate = today.date(day)
      if (nextDate.isBefore(today)) {
        nextDate = nextDate.add(1, 'month')
      }
      return nextDate
    }

    case 'special': {
      const dates = schedule.specialDates
        ?.map((d) => dayjs(d))
        .filter((d) => d.isAfter(today.subtract(1, 'day')))
        .sort((a, b) => a.valueOf() - b.valueOf())
      return dates?.[0] ?? null
    }

    default:
      return null
  }
}

export const getScheduleDescription = (schedule: UpdateSchedule): string => {
  switch (schedule.type) {
    case 'weekly':
      return schedule.weekday ? `每周${getWeekdayName(schedule.weekday)}` : '每周更新'
    case 'biweekly':
      return schedule.weekday
        ? `${schedule.biweekOdd ? '单周' : '双周'}${getWeekdayName(schedule.weekday)}`
        : '双周更新'
    case 'monthly':
      return schedule.monthDay ? `每月${schedule.monthDay}号` : '每月更新'
    case 'special':
      return schedule.specialDates?.length
        ? `${schedule.specialDates.length}个指定日期`
        : '临时加更'
    default:
      return '自定义更新'
  }
}
