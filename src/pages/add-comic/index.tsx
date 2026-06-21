import React, { useState } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useComicStore } from '@/store/useComicStore'
import {
  WEEKDAY_MAP,
  PLATFORM_LIST,
  COVER_COLORS,
  type Weekday,
  type Platform
} from '@/types/comic'

const AddComicPage: React.FC = () => {
  const router = useRouter()
  const editId = router.params.id
  const getComicById = useComicStore((state) => state.getComicById)
  const addComic = useComicStore((state) => state.addComic)
  const updateComic = useComicStore((state) => state.updateComic)

  const editingComic = editId ? getComicById(editId) : null

  const [title, setTitle] = useState(editingComic?.title || '')
  const [platform, setPlatform] = useState<Platform>(editingComic?.platform || PLATFORM_LIST[0])
  const [weekday, setWeekday] = useState<Weekday>(editingComic?.weekday || 3)
  const [updateTime, setUpdateTime] = useState(editingComic?.updateTime || '19:00')
  const [currentChapter, setCurrentChapter] = useState(editingComic?.currentChapter || 1)
  const [coverColor, setCoverColor] = useState(editingComic?.coverColor || COVER_COLORS[0])

  const isEditing = !!editingComic

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入漫画名称', icon: 'none' })
      return
    }
    if (currentChapter < 1) {
      Taro.showToast({ title: '话数必须大于0', icon: 'none' })
      return
    }

    const data = {
      title: title.trim(),
      platform,
      weekday,
      updateTime,
      currentChapter,
      coverColor
    }

    if (isEditing && editId) {
      updateComic(editId, data)
      Taro.showToast({ title: '修改成功', icon: 'success' })
    } else {
      addComic(data)
      Taro.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => {
      Taro.navigateBack()
    }, 500)
  }

  const handleCancel = () => {
    Taro.navigateBack()
  }

  const handleChapterChange = (delta: number) => {
    setCurrentChapter((prev) => Math.max(1, prev + delta))
  }

  return (
    <View className={styles.page}>
      <View className={styles.container}>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.label}>漫画名称 *</Text>
            <Input
              className={styles.input}
              placeholder="请输入漫画名称"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>阅读平台</Text>
            <View className={styles.platformRow}>
              {PLATFORM_LIST.map((p) => (
                <Button
                  key={p}
                  className={classnames(styles.platformItem, platform === p && styles.active)}
                  onClick={() => setPlatform(p)}
                >
                  {p}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>连载周期（每周几更新）</Text>
            <View className={styles.weekdayRow}>
              {(Object.keys(WEEKDAY_MAP) as unknown as Weekday[]).map((day) => (
                <Button
                  key={day}
                  className={classnames(
                    styles.weekdayItem,
                    weekday === Number(day) && styles.active
                  )}
                  onClick={() => setWeekday(Number(day) as Weekday)}
                >
                  {WEEKDAY_MAP[Number(day) as Weekday].slice(1)}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>通常更新时间</Text>
            <View className={styles.timeRow}>
              <Picker
                mode="time"
                value={updateTime}
                onChange={(e) => setUpdateTime(e.detail.value)}
              >
                <View className={styles.timeInput}>
                  <Text>{updateTime}</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>已看到第几话</Text>
            <View className={styles.chapterRow}>
              <Button className={styles.chapterBtn} onClick={() => handleChapterChange(-1)}>
                −
              </Button>
              <Input
                className={styles.chapterInput}
                type="number"
                value={String(currentChapter)}
                onInput={(e) => setCurrentChapter(parseInt(e.detail.value) || 1)}
              />
              <Button className={styles.chapterBtn} onClick={() => handleChapterChange(1)}>
                +
              </Button>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>选择封面颜色</Text>
            <View className={styles.colorRow}>
              {COVER_COLORS.map((color) => (
                <View
                  key={color}
                  className={classnames(styles.colorItem, coverColor === color && styles.active)}
                  style={{ backgroundColor: color }}
                  onClick={() => setCoverColor(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {isEditing ? '保存修改' : '添加漫画'}
        </Button>
      </View>
    </View>
  )
}

export default AddComicPage
