import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { Weekday } from '@/types/comic'
import { useComicStore } from '@/store/useComicStore'
import { getWeekDates, formatDate, getCurrentWeekday } from '@/utils/date'

interface WeekCalendarProps {
  onDaySelect?: (weekday: Weekday) => void
  selectedDay?: Weekday
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ onDaySelect, selectedDay }) => {
  const weekDates = getWeekDates()
  const today = getCurrentWeekday()
  const getComicsByWeekday = useComicStore((state) => state.getComicsByWeekday)
  const [activeDay, setActiveDay] = useState<Weekday>(selectedDay || today)

  useEffect(() => {
    if (selectedDay) {
      setActiveDay(selectedDay)
    }
  }, [selectedDay])

  const handleDayClick = (weekday: Weekday) => {
    setActiveDay(weekday)
    if (onDaySelect) {
      onDaySelect(weekday)
    }
  }

  return (
    <View className={styles.weekCalendar}>
      <View className={styles.header}>
        <Text className={styles.weekLabel}>本周追更</Text>
        <Text className={styles.todayLabel}>今天是 {formatDate(weekDates[today - 1].date, 'MM月DD日')}</Text>
      </View>

      <View className={styles.daysRow}>
        {weekDates.map(({ weekday, isToday, date }) => {
          const comics = getComicsByWeekday(weekday, date)
          const activeCount = comics.filter((c) => !c.isOnHiatus).length
          return (
            <View
              key={weekday}
              className={classnames(styles.dayItem, activeDay === weekday && styles.active)}
              onClick={() => handleDayClick(weekday)}
            >
              <Text className={styles.dayName}>{weekday === 1 ? '一' : weekday === 2 ? '二' : weekday === 3 ? '三' : weekday === 4 ? '四' : weekday === 5 ? '五' : weekday === 6 ? '六' : '日'}</Text>
              <Text className={styles.dayDate}>{date.format('DD')}</Text>
              {isToday && <View className={styles.todayDot} />}
              <Text className={styles.comicCount}>{activeCount}部</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default WeekCalendar
