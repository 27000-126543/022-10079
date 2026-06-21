import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import WeekCalendar from '@/components/WeekCalendar'
import ComicCard from '@/components/ComicCard'
import EmptyState from '@/components/EmptyState'
import { useComicStore } from '@/store/useComicStore'
import { getWeekDates, formatDate, getCurrentWeekday } from '@/utils/date'
import type { Weekday } from '@/types/comic'
import { WEEKDAY_MAP } from '@/types/comic'
import classnames from 'classnames'

const CalendarPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<Weekday | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const comics = useComicStore((state) => state.comics)
  const getComicsByWeekday = useComicStore((state) => state.getComicsByWeekday)
  const hydrate = useComicStore((state) => state.hydrate)
  const weekDates = getWeekDates()
  const today = getCurrentWeekday()

  useDidShow(() => {
    hydrate()
    setRefreshKey((k) => k + 1)
    console.log('[Calendar] Page showed, comics count:', comics.length)
  })

  const displayDays = useMemo(() => {
    if (selectedDay) {
      return weekDates.filter((d) => d.weekday === selectedDay)
    }
    return weekDates
  }, [selectedDay, weekDates])

  const handleAddComic = () => {
    Taro.navigateTo({
      url: '/pages/add-comic/index'
    })
  }

  const handleDaySelect = (weekday: Weekday) => {
    setSelectedDay(selectedDay === weekday ? null : weekday)
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.container}>
        <View className={styles.header}>
          <Text className={styles.greeting}>📚 我的追更</Text>
          <Text className={styles.subtitle}>
            本周共 {comics.length} 部漫画在追，加油追完！
          </Text>
        </View>

        <WeekCalendar onDaySelect={handleDaySelect} selectedDay={selectedDay || undefined} />

        {displayDays.map(({ weekday, isToday, date }) => {
          const dayComics = getComicsByWeekday(weekday, date)
          const activeComics = dayComics.filter((c) => !c.isOnHiatus)
          const hiatusComics = dayComics.filter((c) => c.isOnHiatus)
          return (
            <View key={`${weekday}-${refreshKey}`} className={styles.daySection}>
              <View className={classnames(styles.dayHeader, isToday && styles.todayHighlight)}>
                <View className={styles.dayTitle}>
                  <Text className={styles.dayName}>{WEEKDAY_MAP[weekday]}</Text>
                  <Text className={styles.dayCount}>
                    {activeComics.length} 部更新
                    {hiatusComics.length > 0 && ` / ${hiatusComics.length} 休刊`}
                  </Text>
                </View>
                <Text className={styles.dateText}>{formatDate(date)}</Text>
              </View>

              {dayComics.length === 0 ? (
                <EmptyState
                  emoji="😴"
                  title="今天没有漫画更新"
                  description="好好休息，或者去添加新漫画吧"
                />
              ) : (
                dayComics.map((comic) => (
                  <ComicCard key={comic.id} comic={comic} />
                ))
              )}
            </View>
          )
        })}
      </ScrollView>

      <Button className={styles.addBtn} onClick={handleAddComic}>
        +
      </Button>
    </View>
  )
}

export default CalendarPage
