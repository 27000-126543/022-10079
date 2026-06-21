import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TagBadge from '@/components/TagBadge'
import type { Comic, TodayComic, UpdateType, ComicWithHiatusStatus } from '@/types/comic'
import { WEEKDAY_MAP } from '@/types/comic'

type ComicCardData = Comic | TodayComic | ComicWithHiatusStatus

interface ComicCardProps {
  comic: ComicCardData
  showReadButton?: boolean
  onRead?: (id: string) => void
  onClick?: (comic: ComicCardData) => void
}

const ComicCard: React.FC<ComicCardProps> = ({ comic, showReadButton = false, onRead, onClick }) => {
  const todayComic = comic as TodayComic
  const hiatusComic = comic as ComicWithHiatusStatus

  const isRead = todayComic.isRead
  const updateType: UpdateType | undefined = todayComic.updateType
  const isOnHiatus = hiatusComic.isOnHiatus ?? false
  const resumesTomorrow = hiatusComic.resumesTomorrow ?? false

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

  const displayUpdateType: UpdateType | undefined = isOnHiatus ? 'hiatus' : updateType

  return (
    <View className={classnames(styles.comicCard, isOnHiatus && styles.cardHiatus)} onClick={handleClick}>
      <View
        className={classnames(styles.cover, isOnHiatus && styles.coverHiatus)}
        style={{ backgroundColor: isOnHiatus ? '#E0DDF0' : comic.coverColor }}
      >
        <Text className={styles.coverText}>{getCoverText(comic.title)}</Text>
      </View>

      <View className={styles.info}>
        <View className={styles.titleRow}>
          <Text className={classnames(styles.title, isOnHiatus && styles.titleHiatus)}>
            {comic.title}
          </Text>
          {!showReadButton && !isRead && displayUpdateType && displayUpdateType !== 'main' && (
            <View className={styles.readBadge} />
          )}
        </View>

        <View className={styles.metaRow}>
          <TagBadge type="platform" text={comic.platform} />
          {displayUpdateType && displayUpdateType !== 'main' && <TagBadge type={displayUpdateType} />}
          {!showReadButton && !isOnHiatus && (
            <TagBadge text={WEEKDAY_MAP[comic.weekday]} color={comic.coverColor} />
          )}
          {resumesTomorrow && (
            <TagBadge text="明天恢复" color="#52C41A" />
          )}
        </View>

        <View className={styles.chapterRow}>
          <Text className={classnames(styles.chapter, isOnHiatus && styles.textHiatus)}>
            {isOnHiatus ? '休刊中，耐心等待更新' : `已看到第 ${comic.currentChapter} 话${comic.totalChapter ? ` / ${comic.totalChapter} 话` : ''}`}
          </Text>
          {showReadButton ? (
            isOnHiatus ? (
              <Text className={styles.hiatusNotice}>休刊公告</Text>
            ) : (
              <Button
                className={classnames(styles.actionBtn, isRead && styles.readBtn)}
                onClick={handleRead}
              >
                {isRead ? '已看完' : '标记已看'}
              </Button>
            )
          ) : (
            <Text className={classnames(styles.updateTime, isOnHiatus && styles.textHiatus)}>
              {isOnHiatus ? '暂停更新' : `${comic.updateTime} 更新`}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default ComicCard
