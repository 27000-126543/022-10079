import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import ComicCard from '@/components/ComicCard'
import EmptyState from '@/components/EmptyState'
import { useComicStore } from '@/store/useComicStore'
import { formatDate } from '@/utils/date'
import dayjs from 'dayjs'
import type { UpdateType } from '@/types/comic'
import { UPDATE_TYPE_MAP } from '@/types/comic'

type FilterType = 'all' | UpdateType

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'main', label: '正篇' },
  { key: 'extra', label: '番外' },
  { key: 'hiatus', label: '休刊' },
  { key: 'bonus', label: '加更' }
]

const TodayPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const getTodayComics = useComicStore((state) => state.getTodayComics)
  const markAsRead = useComicStore((state) => state.markAsRead)
  const hydrate = useComicStore((state) => state.hydrate)
  const todayComics = getTodayComics()

  useDidShow(() => {
    hydrate()
    setRefreshKey((k) => k + 1)
    console.log('[Today] Page showed, today comics count:', todayComics.length)
  })

  const filteredComics = useMemo(() => {
    if (filter === 'all') return todayComics
    return todayComics.filter((c) => c.updateType === filter)
  }, [todayComics, filter])

  const stats = useMemo(() => {
    const total = todayComics.length
    const read = todayComics.filter((c) => c.isRead).length
    const unread = total - read
    const hiatus = todayComics.filter((c) => c.updateType === 'hiatus').length
    return { total, read, unread, hiatus }
  }, [todayComics])

  const handleMarkRead = (id: string) => {
    const comic = todayComics.find((c) => c.id === id)
    if (comic?.isRead) {
      Taro.showToast({ title: '已经看过啦', icon: 'none' })
      return
    }
    markAsRead(id)
    Taro.showToast({ title: '已标记为已看', icon: 'success' })
  }

  const handleMarkAllRead = () => {
    const unreadComics = todayComics.filter(
      (c) => !c.isRead && c.updateType !== 'hiatus'
    )
    if (unreadComics.length === 0) {
      Taro.showToast({ title: '没有未看的漫画啦', icon: 'none' })
      return
    }
    unreadComics.forEach((c) => markAsRead(c.id))
    Taro.showToast({ title: `已标记 ${unreadComics.length} 部为已看`, icon: 'success' })
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.container}>
        <View className={styles.header}>
          <Text className={styles.dateText}>{formatDate(dayjs(), 'YYYY年MM月DD日 dddd')}</Text>
          <Text className={styles.title}>🎉 今天可看</Text>
          <View className={styles.stats}>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.total}</Text>
              <Text className={styles.label}>部更新</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.unread}</Text>
              <Text className={styles.label}>待观看</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{stats.hiatus}</Text>
              <Text className={styles.label}>休刊中</Text>
            </View>
          </View>
        </View>

        <ScrollView scrollX className={styles.filterBar}>
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              className={classnames(styles.filterItem, filter === f.key && styles.active)}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </ScrollView>

        <View className={styles.comicList}>
          {filteredComics.length === 0 ? (
            <EmptyState
              emoji="🎬"
              title="今天没有该类型的更新"
              description={filter === 'all' ? '添加一些漫画来追更吧' : '换个筛选条件试试看'}
            />
          ) : (
            filteredComics.map((comic) => (
              <ComicCard
                key={comic.id}
                comic={comic}
                showReadButton={comic.updateType !== 'hiatus'}
                onRead={handleMarkRead}
              />
            ))
          )}
        </View>
      </ScrollView>

      {stats.unread > 0 && (
        <View className={styles.batchBar}>
          <View className={styles.info}>
            <Text className={styles.count}>还有 {stats.unread} 部没看</Text>
            <Text className={styles.hint}>看完后点击右侧按钮一键标记</Text>
          </View>
          <Button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            全部已看
          </Button>
        </View>
      )}
    </View>
  )
}

export default TodayPage
