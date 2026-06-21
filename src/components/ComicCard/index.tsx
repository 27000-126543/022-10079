import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TagBadge from '@/components/TagBadge'
import type { Comic, TodayComic, UpdateType } from '@/types/comic'
import { WEEKDAY_MAP } from '@/types/comic'

interface ComicCardProps {
  comic: Comic | TodayComic
  showReadButton?: boolean
  onRead?: (id: string) => void
  onClick?: (comic: Comic | TodayComic) => void
}

const ComicCard: React.FC<ComicCardProps> = ({ comic, showReadButton = false, onRead, onClick }) => {
  const todayComic = comic as TodayComic
  const isRead = todayComic.isRead
  const updateType = todayComic.updateType

  const handleClick = () => {
    if (onClick) {
      onClick(comic)
    } else {
      Taro.navigateTo({
        url: `/pages/comic-detail/index?id=${comic.id}`
      })
    }
  }

  const handleRead = (e) => {
    e.stopPropagation()
    if (onRead) {
      onRead(comic.id)
    }
  }

  const getCoverText = (title: string) => {
    return title.slice(0, 2)
  }

  return (
    <View className={styles.comicCard} onClick={handleClick}>
      <View className={styles.cover} style={{ backgroundColor: comic.coverColor }}>
        <Text className={styles.coverText}>{getCoverText(comic.title)}</Text>
      </View>

      <View className={styles.info}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{comic.title}</Text>
          {!showReadButton && !isRead && updateType && updateType !== 'main' && (
            <View className={styles.readBadge} />
          )}
        </View>

        <View className={styles.metaRow}>
          <TagBadge type="platform" text={comic.platform} />
          {updateType && updateType !== 'main' && <TagBadge type={updateType} />}
          {!showReadButton && (
            <TagBadge text={WEEKDAY_MAP[comic.weekday]} color={comic.coverColor} />
          )}
        </View>

        <View className={styles.chapterRow}>
          <Text className={styles.chapter}>
            已看到第 {comic.currentChapter} 话
            {comic.totalChapter ? ` / ${comic.totalChapter} 话` : ''}
          </Text>
          {showReadButton ? (
            <Button
              className={classnames(styles.actionBtn, isRead && styles.readBtn)}
              onClick={handleRead}
            >
              {isRead ? '已看完' : '标记已看'}
            </Button>
          ) : (
            <Text className={styles.updateTime}>{comic.updateTime} 更新</Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default ComicCard
