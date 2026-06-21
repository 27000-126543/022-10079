import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import EmptyState from '@/components/EmptyState'
import { useComicStore } from '@/store/useComicStore'
import { getWeekKey, addWeeks, isSameWeek } from '@/utils/date'

interface HiatusItem {
  comicId: string
  comicTitle: string
  platform: string
  coverColor: string
  startWeek: string
  weeksCount: number
  reason?: string
  endWeek: string
  isCurrent: boolean
  resumesTomorrow: boolean
}

const HiatusPage: React.FC = () => {
  const comics = useComicStore((state) => state.comics)
  const [refreshKey, setRefreshKey] = React.useState(0)

  useDidShow(() => {
    setRefreshKey((k) => k + 1)
  })

  const allHiatus = useMemo<HiatusItem[]>(() => {
    const currentWeek = getWeekKey()
    const tomorrowWeek = getWeekKey()
    const list: HiatusItem[] = []

    comics.forEach((comic) => {
      comic.hiatalRecords.forEach((record) => {
        const endWeek = addWeeks(record.startWeek, record.weeksCount - 1)
        const resumeWeek = addWeeks(record.startWeek, record.weeksCount)

        let isCurrent = false
        for (let i = 0; i < record.weeksCount; i++) {
          if (isSameWeek(currentWeek, addWeeks(record.startWeek, i))) {
            isCurrent = true
            break
          }
        }

        list.push({
          comicId: comic.id,
          comicTitle: comic.title,
          platform: comic.platform,
          coverColor: comic.coverColor,
          startWeek: record.startWeek,
          weeksCount: record.weeksCount,
          reason: record.reason,
          endWeek,
          isCurrent,
          resumesTomorrow: isSameWeek(tomorrowWeek, resumeWeek)
        })
      })
    })

    return list.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      return b.startWeek.localeCompare(a.startWeek)
    })
  }, [comics, refreshKey])

  const stats = useMemo(() => {
    const current = allHiatus.filter((h) => h.isCurrent).length
    const resumesSoon = allHiatus.filter((h) => h.resumesTomorrow).length
    return { total: allHiatus.length, current, resumesSoon }
  }, [allHiatus])

  const getCoverText = (title: string) => title.slice(0, 2)

  const handleCardClick = (comicId: string) => {
    Taro.navigateTo({
      url: `/pages/comic-detail/index?id=${comicId}`
    })
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.container}>
        <View className={styles.header}>
          <Text className={styles.title}>📝 休刊记录</Text>
          <Text className={styles.subtitle}>记录漫画休刊情况，不错过恢复更新</Text>
          <View className={styles.stats}>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.total}</Text>
              <Text className={styles.label}>总记录</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.current}</Text>
              <Text className={styles.label}>休刊中</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.resumesSoon}</Text>
              <Text className={styles.label}>即将恢复</Text>
            </View>
          </View>
        </View>

        <Text className={styles.sectionTitle}>休刊列表</Text>

        {allHiatus.length === 0 ? (
          <EmptyState
            emoji="🎉"
            title="暂无休刊记录"
            description="所有漫画都在正常连载中，太棒了！"
          />
        ) : (
          allHiatus.map((item, index) => (
            <View
              key={`${item.comicId}-${index}`}
              className={styles.hiatusCard}
              onClick={() => handleCardClick(item.comicId)}
            >
              <View className={styles.cardHeader}>
                <View className={styles.cover} style={{ backgroundColor: item.coverColor }}>
                  <Text className={styles.coverText}>{getCoverText(item.comicTitle)}</Text>
                </View>
                <View className={styles.info}>
                  <Text className={styles.title}>{item.comicTitle}</Text>
                  <Text className={styles.platform}>{item.platform}</Text>
                </View>
                <View className={styles.weeksBadge}>休刊{item.weeksCount}周</View>
              </View>

              <View className={styles.cardBody}>
                <View className={styles.infoGrid}>
                  <View className={styles.infoItem}>
                    <Text className={styles.label}>开始周</Text>
                    <Text className={styles.value}>{item.startWeek}</Text>
                  </View>
                  <View className={styles.infoItem}>
                    <Text className={styles.label}>结束周</Text>
                    <Text className={styles.value}>{item.endWeek}</Text>
                  </View>
                  <View className={styles.infoItem}>
                    <Text className={styles.label}>状态</Text>
                    <Text className={styles.value} style={{ color: item.isCurrent ? '#FFA940' : '#86909C' }}>
                      {item.isCurrent ? '休刊中' : '已结束'}
                    </Text>
                  </View>
                </View>

                {item.reason && <Text className={styles.reasonText}>📌 {item.reason}</Text>}

                {item.resumesTomorrow && (
                  <View className={styles.upcomingBadge}>明天恢复更新！</View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default HiatusPage
