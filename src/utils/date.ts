import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'
import type { Weekday, HiatusRecord } from '@/types/comic'

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

    const hiatusStartDate = startOfStartWeek.isoWeekday(comicWeekday)
    const hiatusEndDate = hiatusStartDate.add((record.weeksCount - 1) * 7, 'day').endOf('day')
    const resumeDate = hiatusEndDate.add(1, 'day').startOf('day')

    if (today.isBefore(resumeDate) && today.isAfter(hiatusStartDate.subtract(1, 'day').endOf('day'))) {
      return {
        isOnHiatus: !today.isSame(resumeDate, 'day'),
        resumesTomorrow: tomorrow.isSame(resumeDate, 'day'),
        startDate: hiatusStartDate.format('YYYY-MM-DD'),
        endDate: hiatusEndDate.format('YYYY-MM-DD')
      }
    }
  }

  return {
    isOnHiatus: false,
    resumesTomorrow: false,
    startDate: null,
    endDate: null
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

    const hiatusStartDate = startOfStartWeek.isoWeekday(comicWeekday)
    const hiatusEndDate = hiatusStartDate.add((record.weeksCount - 1) * 7, 'day').endOf('day')

    if (targetDate.isBetween(hiatusStartDate.subtract(1, 'second'), hiatusEndDate.add(1, 'second'))) {
      return true
    }
  }
  return false
}

