import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import ComicCard from '@/components/ComicCard'
import EmptyState from '@/components/EmptyState'
import { useComicStore } from '@/store/useComicStore'
import { formatDate, getScheduleDescription } from '@/utils/date'
import dayjs from 'dayjs'
import type { UpdateType, ComicWithHiatusStatus } from '@/types/comic'
import { UPDATE_TYPE_MAP, WEEKDAY_MAP, PLATFORM_LIST } from '@/types/comic'

type FilterType = 'all' | UpdateType
type SubFilterType = 'all' | 'platform' | 'weekday'

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'main', label: '正篇' },
  { key: 'extra', label: '番外' },
  { key: 'hiatus', label: '休刊' },
  { key: 'bonus', label: '加更' }
]

const TodayPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all')
  const [subFilter, setSubFilter] = useState<SubFilterType>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedWeekday, setSelectedWeekday] = useState<number | 'all'>('all')
  const [showWeekDetail, setShowWeekDetail] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const getTodayComics = useComicStore((state) => state.getTodayComics)
  const getWeeklyProgress = useComicStore((state) => state.getWeeklyProgress)
  const getComicsForWeek = useComicStore((state) => state.getComicsForWeek)
  const markAsRead = useComicStore((state) => state.markAsRead)
  const hydrate = useComicStore((state) => state.hydrate)
  const todayComics = getTodayComics()
  const weekProgress = getWeeklyProgress()
  const weekComics = getComicsForWeek()

  useDidShow(() => {
    hydrate()
    setRefreshKey((k) => k + 1)
    console.log('[Today] Page showed, today comics count:', todayComics.length)
  })

  const filteredComics = useMemo(() => {
    let comics = [...todayComics]
    if (filter !== 'all') {
      comics = comics.filter((c) => c.updateType === filter)
    }
    return comics
  }, [todayComics, filter])

  const stats = useMemo(() => {
    const total = todayComics.length
    const read = todayComics.filter((c) => c.isRead).length
    const unread = total - read
    const hiatus = todayComics.filter((c) => c.updateType === 'hiatus').length
    return { total, read, unread, hiatus }
  }, [todayComics])

  const filteredWeekComics = useMemo(() => {
    let comics = [...weekComics]
    if (selectedPlatform !== 'all') {
      comics = comics.filter((c) => c.platform === selectedPlatform)
    }
    if (selectedWeekday !== 'all') {
      comics = comics.filter((c) => c.scheduledDate && dayjs(c.scheduledDate).isoWeekday() === selectedWeekday)
    }
    return comics
  }, [weekComics, selectedPlatform, selectedWeekday])

  const groupedWeekComics = useMemo(() => {
    const unread = filteredWeekComics.filter((c) => !c.isRead)
    const read = filteredWeekComics.filter((c) => c.isRead)

    const byPlatform: Record<string, ComicWithHiatusStatus[]> = {}
    const byWeekday: Record<number, ComicWithHiatusStatus[]> = {}

    unread.forEach((c) => {
      if (!byPlatform[c.platform]) byPlatform[c.platform] = []
      byPlatform[c.platform].push(c)

      if (c.scheduledDate) {
        const wd = dayjs(c.scheduledDate).isoWeekday() as number
        if (!byWeekday[wd]) byWeekday[wd] = []
        byWeekday[wd].push(c)
      }
    })

    return { unread, read, byPlatform, byWeekday }
  }, [filteredWeekComics, subFilter])

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

  const progressPercent = weekProgress.total > 0 ? Math.round((weekProgress.read / weekProgress.total) * 100) : 0

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

        <View className={styles.weekProgressCard}>
          <View className={styles.weekProgressHeader}>
            <Text className={styles.title}>📊 本周追更进度</Text>
            <Text className={styles.toggleBtn} onClick={() => setShowWeekDetail(!showWeekDetail)}>
              {showWeekDetail ? '收起' : '展开'}
            </Text>
          </View>
          <View className={styles.weekProgressStats}>
            <View className={styles.statItem}>
              <Text className={styles.num}>{weekProgress.total}</Text>
              <Text className={styles.label}>应看</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{weekProgress.read}</Text>
              <Text className={styles.label}>已看</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.num}>{weekProgress.unread}</Text>
              <Text className={styles.label}>未看</Text>
            </View>
          </View>
          <View className={styles.progressBarContainer}>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </View>
            <Text className={styles.progressText}>{progressPercent}% 已完成</Text>
          </View>

          {showWeekDetail && (
            <>
              <View className={styles.subFilterBar}>
                <Button
                  className={classnames(styles.subFilterItem, subFilter === 'all' && styles.active)}
                  onClick={() => setSubFilter('all')}
                >
                  全部未看
                </Button>
                <Button
                  className={classnames(styles.subFilterItem, subFilter === 'platform' && styles.active)}
                  onClick={() => setSubFilter('platform')}
                >
                  按平台
                </Button>
                <Button
                  className={classnames(styles.subFilterItem, subFilter === 'weekday' && styles.active)}
                  onClick={() => setSubFilter('weekday')}
                >
                  按星期
                </Button>
              </View>

              {subFilter === 'all' && (
                <>
                  {selectedPlatform !== 'all' || selectedWeekday !== 'all' ? (
                    <View className={styles.subFilterBar}>
                      <Button
                        className={classnames(styles.subFilterItem, selectedPlatform === 'all' && styles.active)}
                        onClick={() => setSelectedPlatform('all')}
                      >
                        全部平台
                      </Button>
                      {PLATFORM_LIST.map((p) => (
                        <Button
                          key={p}
                          className={classnames(styles.subFilterItem, selectedPlatform === p && styles.active)}
                          onClick={() => setSelectedPlatform(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </View>
                  ) : (
                    <>
                      <View className={styles.subFilterBar}>
                        <Button
                          className={classnames(styles.subFilterItem, selectedPlatform === 'all' && styles.active)}
                          onClick={() => { setSelectedPlatform('all'); setSelectedWeekday('all') }}
                        >
                          全部平台
                        </Button>
                        {PLATFORM_LIST.map((p) => (
                          <Button
                            key={p}
                            className={classnames(styles.subFilterItem, selectedPlatform === p && styles.active)}
                            onClick={() => { setSelectedPlatform(p); setSelectedWeekday('all') }}
                          >
                            {p}
                          </Button>
                        ))}
                      </View>
                      <View className={styles.subFilterBar}>
                        <Button
                          className={classnames(styles.subFilterItem, selectedWeekday === 'all' && styles.active)}
                          onClick={() => { setSelectedWeekday('all'); setSelectedPlatform('all') }}
                        >
                          全部星期
                        </Button>
                        {[1, 2, 3, 4, 5, 6, 7].map((w) => (
                          <Button
                            key={w}
                            className={classnames(styles.subFilterItem, selectedWeekday === w && styles.active)}
                            onClick={() => { setSelectedWeekday(w); setSelectedPlatform('all') }}
                          >
                            {WEEKDAY_MAP[w as 1 | 2 | 3 | 4 | 5 | 6 | 7]}
                          </Button>
                        ))}
                      </View>
                    </>
                  )}

                  {groupedWeekComics.unread.length > 0 ? (
                    <View className={styles.unreadSection}>
                      <Text className={styles.sectionTitle}>
                        未看列表
                        <Text className={styles.count}>{groupedWeekComics.unread.length}</Text>
                      </Text>
                      {groupedWeekComics.unread.map((comic) => (
                        <ComicCard
                          key={`week-${comic.id}-${comic.scheduledDate}`}
                          comic={comic}
                          showReadButton={comic.updateType !== 'hiatus'}
                          onRead={handleMarkRead}
                        />
                      ))}
                    </View>
                  ) : (
                    <View className={styles.unreadSection}>
                      <EmptyState
                        emoji="✨"
                        title="太棒了！"
                        description="本周已全部追完"
                      />
                    </View>
                  )}

                  {groupedWeekComics.read.length > 0 && (
                    <View className={styles.readSection}>
                      <Text className={styles.sectionTitle}>
                        已看列表
                        <Text className={styles.count}>{groupedWeekComics.read.length}</Text>
                      </Text>
                      {groupedWeekComics.read.map((comic) => (
                        <ComicCard
                          key={`week-read-${comic.id}-${comic.scheduledDate}`}
                          comic={comic}
                          showReadButton={false}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}

              {subFilter === 'platform' && (
                <View>
                  {Object.keys(groupedWeekComics.byPlatform).length > 0 ? (
                    Object.entries(groupedWeekComics.byPlatform).map(([platform, comics]) => (
                      <View key={platform}>
                        <Text className={styles.groupTitle}>{platform} ({comics.length})</Text>
                        {comics.map((comic) => (
                          <ComicCard
                            key={`${platform}-${comic.id}-${comic.scheduledDate}`}
                            comic={comic}
                            showReadButton={comic.updateType !== 'hiatus'}
                            onRead={handleMarkRead}
                          />
                        ))}
                      </View>
                    ))
                  ) : (
                    <View className={styles.unreadSection}>
                      <EmptyState
                        emoji="✨"
                        title="太棒了！"
                        description="本周已全部追完"
                      />
                    </View>
                  )}
                </View>
              )}

              {subFilter === 'weekday' && (
                <View>
                  {Object.keys(groupedWeekComics.byWeekday).length > 0 ? (
                    Object.entries(groupedWeekComics.byWeekday)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([weekday, comics]) => (
                        <View key={weekday}>
                          <Text className={styles.groupTitle}>
                            {WEEKDAY_MAP[Number(weekday) as 1 | 2 | 3 | 4 | 5 | 6 | 7]} ({comics.length})
                          </Text>
                          {comics.map((comic) => (
                            <ComicCard
                              key={`${weekday}-${comic.id}-${comic.scheduledDate}`}
                              comic={comic}
                              showReadButton={comic.updateType !== 'hiatus'}
                              onRead={handleMarkRead}
                            />
                          ))}
                        </View>
                      ))
                  ) : (
                    <View className={styles.unreadSection}>
                      <EmptyState
                        emoji="✨"
                        title="太棒了！"
                        description="本周已全部追完"
                      />
                    </View>
                  )}
                </View>
              )}
            </>
          )}
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
