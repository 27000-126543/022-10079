import React, { useState, useMemo } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useComicStore } from '@/store/useComicStore'
import {
  WEEKDAY_MAP,
  PLATFORM_LIST,
  COVER_COLORS,
  MONTH_DAYS,
  SCHEDULE_TYPE_MAP,
  type Weekday,
  type Platform,
  type ScheduleType,
  type UpdateSchedule
} from '@/types/comic'

const SCHEDULE_TYPES: { type: ScheduleType; label: string; desc: string }[] = [
  { type: 'weekly', label: '每周', desc: '固定周几' },
  { type: 'biweekly', label: '双周', desc: '隔周更新' },
  { type: 'monthly', label: '每月', desc: '固定日期' },
  { type: 'special', label: '临时', desc: '指定日期' }
]

const AddComicPage: React.FC = () => {
  const router = useRouter()
  const editId = router.params.id
  const getComicById = useComicStore((state) => state.getComicById)
  const addComic = useComicStore((state) => state.addComic)
  const updateComic = useComicStore((state) => state.updateComic)
  const addSpecialDate = useComicStore((state) => state.addSpecialDate)

  const editingComic = editId ? getComicById(editId) : null

  const [title, setTitle] = useState(editingComic?.title || '')
  const [platform, setPlatform] = useState<Platform>(editingComic?.platform || PLATFORM_LIST[0])
  const [scheduleType, setScheduleType] = useState<ScheduleType>(editingComic?.schedule?.type || 'weekly')
  const [weekday, setWeekday] = useState<Weekday>(editingComic?.schedule?.weekday || 3)
  const [biweekOdd, setBiweekOdd] = useState<boolean>(editingComic?.schedule?.biweekOdd ?? true)
  const [monthDay, setMonthDay] = useState<number>(editingComic?.schedule?.monthDay || 1)
  const [specialDates, setSpecialDates] = useState<string[]>(editingComic?.schedule?.specialDates || [])
  const [updateTime, setUpdateTime] = useState(editingComic?.updateTime || '19:00')
  const [currentChapter, setCurrentChapter] = useState(editingComic?.currentChapter || 1)
  const [coverColor, setCoverColor] = useState(editingComic?.coverColor || COVER_COLORS[0])

  const isEditing = !!editingComic

  const schedule: UpdateSchedule = useMemo(() => {
    const base = { type: scheduleType }
    switch (scheduleType) {
      case 'weekly':
        return { ...base, weekday }
      case 'biweekly':
        return { ...base, weekday, biweekOdd }
      case 'monthly':
        return { ...base, monthDay }
      case 'special':
        return { ...base, specialDates }
      default:
        return { ...base, weekday }
    }
  }, [scheduleType, weekday, biweekOdd, monthDay, specialDates])

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入漫画名称', icon: 'none' })
      return
    }
    if (currentChapter < 1) {
      Taro.showToast({ title: '话数必须大于0', icon: 'none' })
      return
    }
    if (scheduleType === 'special' && specialDates.length === 0) {
      Taro.showToast({ title: '请至少添加一个更新日期', icon: 'none' })
      return
    }

    const data = {
      title: title.trim(),
      platform,
      weekday,
      schedule,
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

  const handleAddSpecialDate = () => {
    const today = new Date()
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    const [year, month, day] = defaultDate.split('-')
    const dateStr = `${year}年${parseInt(month)}月${parseInt(day)}日`
    
    Taro.showModal({
      title: '添加更新日期',
      content: `请输入日期 (格式: YYYY-MM-DD)\n例如: ${defaultDate}`,
      editable: true,
      placeholderText: defaultDate,
      success: (res) => {
        if (res.confirm && res.content) {
          const inputDate = res.content.trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
            if (!specialDates.includes(inputDate)) {
              setSpecialDates([...specialDates, inputDate].sort())
              Taro.showToast({ title: '已添加', icon: 'success' })
            } else {
              Taro.showToast({ title: '该日期已存在', icon: 'none' })
            }
          } else {
            Taro.showToast({ title: '日期格式错误', icon: 'none' })
          }
        }
      }
    })
  }

  const handleRemoveSpecialDate = (date: string) => {
    setSpecialDates(specialDates.filter((d) => d !== date))
  }

  const renderScheduleOptions = () => {
    switch (scheduleType) {
      case 'weekly':
      case 'biweekly':
        return (
          <>
            <View className={styles.formItem}>
              <Text className={styles.label}>更新星期</Text>
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
            {scheduleType === 'biweekly' && (
              <View className={styles.formItem}>
                <Text className={styles.label}>更新周期</Text>
                <View className={styles.biweekRow}>
                  <Button
                    className={classnames(styles.biweekItem, biweekOdd && styles.active)}
                    onClick={() => setBiweekOdd(true)}
                  >
                    单周
                  </Button>
                  <Button
                    className={classnames(styles.biweekItem, !biweekOdd && styles.active)}
                    onClick={() => setBiweekOdd(false)}
                  >
                    双周
                  </Button>
                </View>
              </View>
            )}
          </>
        )
      case 'monthly':
        return (
          <View className={styles.formItem}>
            <Text className={styles.label}>每月几号更新</Text>
            <View className={styles.monthDayRow}>
              {MONTH_DAYS.map((day) => (
                <Button
                key={day}
                className={classnames(
                  styles.monthDayItem, monthDay === day && styles.active
                )}
                onClick={() => setMonthDay(day)}
              >
                {day}
              </Button>
            ))}
            </View>
          </View>
        )
      case 'special':
        return (
          <View className={styles.formItem}>
            <Text className={styles.label}>
              临时更新日期</Text>
            {specialDates.length > 0 && (
                <View className={styles.specialDatesList}>
                  {specialDates.map((date) => (
                    <View key={date} className={styles.specialDateChip}>
                      <Text>{date}</Text>
                      <Text
                        className={styles.remove}
                        onClick={() => handleRemoveSpecialDate(date)}
                      >
                        ×
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            <Button className={styles.addDateBtn} onClick={handleAddSpecialDate}>
              + 添加更新日期
            </Button>
          </View>
        )
      default:
        return null
    }
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
            <Text className={styles.label}>
              连载周期
              <Text className={styles.labelHint}>
              {SCHEDULE_TYPE_MAP[scheduleType]}
            </Text>
            </Text>
            <View className={styles.scheduleTypeRow}>
              {SCHEDULE_TYPES.map((s) => (
                <Button
                  key={s.type}
                  className={classnames(styles.scheduleTypeItem, scheduleType === s.type && styles.active)}
                  onClick={() => setScheduleType(s.type)}
                >
                  <Text className={styles.typeLabel}>{s.label}</Text>
                  <Text className={styles.typeDesc}>{s.desc}</Text>
                </Button>
              ))}
            </View>
          </View>

          {renderScheduleOptions()}

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
