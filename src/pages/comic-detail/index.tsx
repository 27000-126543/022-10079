import React, { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useComicStore } from '@/store/useComicStore'
import TagBadge from '@/components/TagBadge'
import {
  WEEKDAY_MAP,
  UPDATE_TYPE_MAP,
  type UpdateType
} from '@/types/comic'

const ComicDetailPage: React.FC = () => {
  const router = useRouter()
  const comicId = router.params.id
  const getComicById = useComicStore((state) => state.getComicById)
  const deleteComic = useComicStore((state) => state.deleteComic)
  const toggleFavorite = useComicStore((state) => state.toggleFavorite)
  const setNextUpdateType = useComicStore((state) => state.setNextUpdateType)
  const addHiatus = useComicStore((state) => state.addHiatus)
  const nextUpdateTypes = useComicStore((state) => state.nextUpdateTypes)

  const [refreshKey, setRefreshKey] = useState(0)
  const [hiatusWeeks, setHiatusWeeks] = useState(1)
  const [hiatusReason, setHiatusReason] = useState('')

  useDidShow(() => {
    setRefreshKey((k) => k + 1)
  })

  const comic = comicId ? getComicById(comicId) : null
  const currentUpdateType = comicId ? nextUpdateTypes[comicId] || 'main' : 'main'

  if (!comic) {
    return (
      <View className={styles.page}>
        <View className={styles.container}>
          <Text>漫画不存在</Text>
        </View>
      </View>
    )
  }

  const getCoverText = (title: string) => title.slice(0, 2)

  const handleEdit = () => {
    Taro.navigateTo({
      url: `/pages/add-comic/index?id=${comic.id}`
    })
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${comic.title}」吗？`,
      confirmColor: '#FF5C5C',
      success: (res) => {
        if (res.confirm && comicId) {
          deleteComic(comicId)
          Taro.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 500)
        }
      }
    })
  }

  const handleToggleFavorite = () => {
    if (comicId) {
      toggleFavorite(comicId)
      setRefreshKey((k) => k + 1)
    }
  }

  const handleUpdateType = (type: UpdateType) => {
    if (comicId) {
      setNextUpdateType(comicId, type)
      setRefreshKey((k) => k + 1)
    }
  }

  const handleAddHiatus = () => {
    if (!comicId) return
    addHiatus(comicId, hiatusWeeks, hiatusReason || undefined)
    Taro.showToast({ title: '已记录休刊', icon: 'success' })
    setHiatusWeeks(1)
    setHiatusReason('')
    setRefreshKey((k) => k + 1)
  }

  return (
    <View className={styles.page}>
      <View className={styles.container}>
        <View className={styles.header}>
          <View className={styles.cover} style={{ backgroundColor: comic.coverColor }}>
            <Text className={styles.coverText}>{getCoverText(comic.title)}</Text>
          </View>
          <View className={styles.info}>
            <Text className={styles.title}>{comic.title}</Text>
            <View className={styles.meta}>
              <View className={styles.tag}>{comic.platform}</View>
              <View className={styles.tag}>{WEEKDAY_MAP[comic.weekday]}</View>
              <View className={styles.tag}>{comic.updateTime}</View>
            </View>
            <Text className={styles.chapterText}>
              已看到第 {comic.currentChapter} 话
              {comic.totalChapter ? ` / ${comic.totalChapter} 话` : ''}
            </Text>
          </View>
          <Text className={styles.favorite} onClick={handleToggleFavorite}>
            {comic.isFavorite ? '❤️' : '🤍'}
          </Text>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text>基本信息</Text>
            <Text className={styles.editLink} onClick={handleEdit}>编辑</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>阅读平台</Text>
            <Text className={styles.value}>{comic.platform}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>更新时间</Text>
            <Text className={styles.value}>
              {WEEKDAY_MAP[comic.weekday]} {comic.updateTime}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>当前进度</Text>
            <Text className={styles.value}>
              第 {comic.currentChapter} 话
              {comic.totalChapter ? ` / ${comic.totalChapter} 话` : ''}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>添加时间</Text>
            <Text className={styles.value}>
              {new Date(comic.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text>下次更新类型</Text>
          </View>
          <Text className={styles.formLabel}>标记下次更新是正篇、番外还是加更：</Text>
          <View className={styles.updateTypeRow}>
            {(Object.keys(UPDATE_TYPE_MAP) as UpdateType[]).filter(t => t !== 'hiatus').map((type) => (
              <Button
                key={type}
                className={classnames(
                  styles.updateTypeItem,
                  currentUpdateType === type && styles.active
                )}
                style={
                  currentUpdateType === type
                    ? { backgroundColor: UPDATE_TYPE_MAP[type].color }
                    : undefined
                }
                onClick={() => handleUpdateType(type)}
              >
                {UPDATE_TYPE_MAP[type].label}
              </Button>
            ))}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <Text>临时休刊记录</Text>
          </View>

          <View className={styles.hiatusForm}>
            <Text className={styles.formLabel}>休刊周数：</Text>
            <View className={styles.weeksRow}>
              {[1, 2, 3, 4].map((w) => (
                <Button
                  key={w}
                  className={classnames(styles.weekBtn, hiatusWeeks === w && styles.active)}
                  onClick={() => setHiatusWeeks(w)}
                >
                  {w}周
                </Button>
              ))}
            </View>

            <Text className={styles.formLabel}>原因（可选）：</Text>
            <Input
              className={styles.reasonInput}
              placeholder="例如：作者取材、身体不适等"
              value={hiatusReason}
              onInput={(e) => setHiatusReason(e.detail.value)}
            />

            <Button className={styles.addHiatusBtn} onClick={handleAddHiatus}>
              记录休刊
            </Button>
          </View>

          {comic.hiatalRecords.length > 0 && (
            <View className={styles.hiatusList}>
              {comic.hiatalRecords.map((h) => (
                <View key={h.id} className={styles.hiatusItem}>
                  <View className={styles.hiatusHeader}>
                    <Text className={styles.weeks}>休刊 {h.weeksCount} 周</Text>
                    <Text className={styles.week}>{h.startWeek}</Text>
                  </View>
                  {h.reason && <Text className={styles.reason}>原因：{h.reason}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.editBtn} onClick={handleEdit}>
          编辑信息
        </Button>
        <Button className={styles.deleteBtn} onClick={handleDelete}>
          删除漫画
        </Button>
      </View>
    </View>
  )
}

export default ComicDetailPage
