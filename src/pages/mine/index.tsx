import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import TagBadge from '@/components/TagBadge'
import EmptyState from '@/components/EmptyState'
import { useComicStore } from '@/store/useComicStore'
import { WEEKDAY_MAP } from '@/types/comic'

const MinePage: React.FC = () => {
  const comics = useComicStore((state) => state.comics)
  const toggleFavorite = useComicStore((state) => state.toggleFavorite)
  const getComicById = useComicStore((state) => state.getComicById)

  useDidShow(() => {
    console.log('[Mine] Page showed, total comics:', comics.length)
  })

  const stats = useMemo(() => {
    const total = comics.length
    const favorites = comics.filter((c) => c.isFavorite).length
    const totalChapters = comics.reduce((sum, c) => sum + c.currentChapter, 0)
    return { total, favorites, totalChapters }
  }, [comics])

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleComicClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/comic-detail/index?id=${id}`
    })
  }

  const handleToggleFavorite = (e, id: string) => {
    e.stopPropagation()
    toggleFavorite(id)
  }

  const menuItems = [
    {
      icon: '➕',
      iconClass: styles.iconPurple,
      title: '添加新漫画',
      desc: '添加你正在追的漫画作品',
      onClick: () => handleNavigate('/pages/add-comic/index')
    },
    {
      icon: '📝',
      iconClass: styles.iconOrange,
      title: '休刊记录',
      desc: '管理临时休刊和恢复提醒',
      onClick: () => handleNavigate('/pages/hiatus/index')
    }
  ]

  const getCoverText = (title: string) => title.slice(0, 2)

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.container}>
        <View className={styles.profileHeader}>
          <View className={styles.avatar}>🎨</View>
          <View className={styles.info}>
            <Text className={styles.nickname}>漫画爱好者</Text>
            <Text className={styles.motto}>追更使人快乐 📖</Text>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statItem}>
            <Text className={styles.num}>{stats.total}</Text>
            <Text className={styles.label}>追更中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.num}>{stats.favorites}</Text>
            <Text className={styles.label}>收藏</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.num}>{stats.totalChapters}</Text>
            <Text className={styles.label}>已看话数</Text>
          </View>
        </View>

        <Text className={styles.sectionTitle}>快捷操作</Text>
        <View className={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={index} className={styles.menuItem} onClick={item.onClick}>
              <View className={`${styles.icon} ${item.iconClass}`}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.content}>
                <Text className={item.titleStyle || styles.title}>{item.title}</Text>
                <Text className={styles.desc}>{item.desc}</Text>
              </View>
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>

        <Text className={styles.sectionTitle}>我的漫画</Text>
        {comics.length === 0 ? (
          <EmptyState
            emoji="📚"
            title="还没有追更的漫画"
            description="点击上方「添加新漫画」开始记录吧"
          />
        ) : (
          <View className={styles.comicList}>
            {comics.map((comic) => (
              <View
                key={comic.id}
                className={styles.comicItem}
                onClick={() => handleComicClick(comic.id)}
              >
                <View className={styles.cover} style={{ backgroundColor: comic.coverColor }}>
                  <Text className={styles.coverText}>{getCoverText(comic.title)}</Text>
                </View>
                <View className={styles.info}>
                  <Text className={styles.title}>{comic.title}</Text>
                  <Text className={styles.meta}>
                    {WEEKDAY_MAP[comic.weekday]} {comic.updateTime} · 已看第
                    {comic.currentChapter}话
                  </Text>
                </View>
                <Text
                  className={styles.favorite}
                  onClick={(e) => handleToggleFavorite(e, comic.id)}
                >
                  {comic.isFavorite ? '❤️' : '🤍'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default MinePage
