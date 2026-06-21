import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type {
  Comic,
  HiatusRecord,
  Weekday,
  UpdateType,
  TodayComic,
  ComicWithHiatusStatus,
  ActivityLog,
  ActivityType,
  UpdateSchedule,
  ScheduleType,
  Platform
} from '@/types/comic'
import { UPDATE_TYPE_MAP } from '@/types/comic'
import { mockComics } from '@/data/mockComics'
import {
  generateId,
  getCurrentWeekday,
  getWeekKey,
  getWeekDates,
  getHiatusStatus,
  isComicOnHiatusByDate,
  isScheduledToUpdate,
  getNextUpdateDate,
  getScheduleDescription
} from '@/utils/date'
import dayjs from 'dayjs'

const STORAGE_KEY = 'comic_tracker_data_v2'

interface PersistedState {
  comics: Comic[]
  readRecords: Record<string, string>
  nextUpdateTypes: Record<string, UpdateType>
}

const loadFromStorage = (): PersistedState | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    if (data) {
      return JSON.parse(data) as PersistedState
    }
  } catch (e) {
    console.error('[Store] Failed to load from storage:', e)
  }
  return null
}

const saveToStorage = (state: PersistedState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state))
    console.log('[Store] Saved to storage, comics:', state.comics.length)
  } catch (e) {
    console.error('[Store] Failed to save to storage:', e)
  }
}

const getInitialState = (): PersistedState => {
  const persisted = loadFromStorage()
  if (persisted && persisted.comics && persisted.comics.length > 0) {
    console.log('[Store] Loaded from storage, comics count:', persisted.comics.length)
    return persisted
  }
  console.log('[Store] No persisted data, using mock data')
  return {
    comics: mockComics,
    readRecords: {},
    nextUpdateTypes: {}
  }
}

const addActivityLog = (
  comics: Comic[],
  comicId: string,
  type: ActivityType,
  detail: string,
  extra?: {
    oldValue?: string
    newValue?: string
    chapter?: number
  }
): Comic[] => {
  const log: ActivityLog = {
    id: generateId(),
    comicId,
    type,
    timestamp: Date.now(),
    detail,
    oldValue: extra?.oldValue,
    newValue: extra?.newValue,
    chapter: extra?.chapter
  }
  return comics.map((c) =>
    c.id === comicId
      ? { ...c, activityLogs: [log, ...c.activityLogs].slice(0, 100) }
      : c
  )
}

interface ComicState extends PersistedState {
  hydrate: () => void
  addComic: (data: {
    title: string
    platform: Platform
    weekday: Weekday
    updateTime: string
    currentChapter: number
    coverColor: string
    schedule: UpdateSchedule
  }) => void
  updateComic: (id: string, data: Partial<Comic>) => void
  deleteComic: (id: string) => void
  markAsRead: (comicId: string) => void
  unmarkAsRead: (comicId: string) => void
  setNextUpdateType: (comicId: string, type: UpdateType) => void
  addHiatus: (comicId: string, weeksCount: number, reason?: string) => void
  getComicsByWeekday: (weekday: Weekday, targetDate?: dayjs.Dayjs) => ComicWithHiatusStatus[]
  getTodayComics: () => TodayComic[]
  getWeeklyProgress: () => {
    total: number
    read: number
    unread: number
    byPlatform: Record<string, number>
    byWeekday: Record<number, number>
  }
  getComicById: (id: string) => Comic | undefined
  toggleFavorite: (id: string) => void
  updateCurrentChapter: (id: string, chapter: number) => void
  isComicReadThisWeek: (comicId: string) => boolean
  addSpecialDate: (comicId: string, dateStr: string) => void
  getActivityLogs: (comicId: string) => ActivityLog[]
  getComicsForWeek: () => ComicWithHiatusStatus[]
}

const initialState = getInitialState()

export const useComicStore = create<ComicState>((set, get) => ({
  ...initialState,

  hydrate: () => {
    const persisted = loadFromStorage()
    if (persisted) {
      set(persisted)
    }
  },

  addComic: (data) => {
    const newComic: Comic = {
      id: generateId(),
      title: data.title,
      platform: data.platform,
      weekday: data.weekday,
      updateTime: data.updateTime,
      currentChapter: data.currentChapter,
      isFavorite: false,
      hiatalRecords: [],
      activityLogs: [
        {
          id: generateId(),
          comicId: '',
          type: 'add',
          timestamp: Date.now(),
          detail: `开始追更《${data.title}》`
        }
      ],
      schedule: data.schedule,
      coverColor: data.coverColor,
      createdAt: Date.now()
    }
    newComic.activityLogs[0].comicId = newComic.id

    set((state) => {
      const newState = {
        ...state,
        comics: [...state.comics, newComic]
      }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
    console.log('[Store] Added comic:', newComic.title)
  },

  updateComic: (id, data) => {
    set((state) => {
      let updatedComics = state.comics.map((c) => (c.id === id ? { ...c, ...data } : c))
      const oldComic = state.comics.find((c) => c.id === id)
      if (oldComic && (data.title || data.platform || data.weekday || data.updateTime)) {
        const changes: string[] = []
        if (data.title && data.title !== oldComic.title) changes.push(`标题: ${oldComic.title} → ${data.title}`)
        if (data.platform && data.platform !== oldComic.platform) changes.push(`平台: ${oldComic.platform} → ${data.platform}`)
        if (data.weekday && data.weekday !== oldComic.weekday) {
          const oldDesc = getScheduleDescription(oldComic.schedule)
          const newDesc = data.schedule ? getScheduleDescription(data.schedule) : ''
          changes.push(`更新: ${oldDesc} → ${newDesc}`)
        }
        if (changes.length > 0) {
          updatedComics = addActivityLog(updatedComics, id, 'edit', `编辑了 ${changes.join('、')}`)
        }
      }
      const newState = { ...state, comics: updatedComics }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
    console.log('[Store] Updated comic:', id)
  },

  deleteComic: (id) => {
    set((state) => {
      const newReadRecords = { ...state.readRecords }
      delete newReadRecords[id]
      const newNextTypes = { ...state.nextUpdateTypes }
      delete newNextTypes[id]
      const newState = {
        comics: state.comics.filter((c) => c.id !== id),
        readRecords: newReadRecords,
        nextUpdateTypes: newNextTypes
      }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
    console.log('[Store] Deleted comic:', id)
  },

  markAsRead: (comicId) => {
    const currentWeek = getWeekKey()
    set((state) => {
      const newState = {
        ...state,
        readRecords: { ...state.readRecords, [comicId]: currentWeek }
      }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
    const comic = get().getComicById(comicId)
    if (comic) {
      const newChapter = comic.currentChapter + 1
      set((state) => {
        let updatedComics = addActivityLog(state.comics, comicId, 'read', `看完第 ${newChapter} 话`, {
          oldValue: String(comic.currentChapter),
          newValue: String(newChapter),
          chapter: newChapter
        })
        updatedComics = updatedComics.map((c) =>
          c.id === comicId
            ? { ...c, currentChapter: newChapter, lastReadAt: Date.now() }
            : c
        )
        const newState = { ...state, comics: updatedComics }
        saveToStorage({
          comics: newState.comics,
          readRecords: newState.readRecords,
          nextUpdateTypes: newState.nextUpdateTypes
        })
        return newState
      })
    }
    console.log('[Store] Marked as read this week:', comicId, currentWeek)
  },

  unmarkAsRead: (comicId) => {
    set((state) => {
      const newRecords = { ...state.readRecords }
      delete newRecords[comicId]
      const newState = { ...state, readRecords: newRecords }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  },

  isComicReadThisWeek: (comicId) => {
    const state = get()
    const readWeek = state.readRecords[comicId]
    const currentWeek = getWeekKey()
    return readWeek === currentWeek
  },

  setNextUpdateType: (comicId, type) => {
    set((state) => {
      const oldType = state.nextUpdateTypes[comicId] || 'main'
      let updatedComics = addActivityLog(
        state.comics,
        comicId,
        'update_type',
        `更新类型: ${UPDATE_TYPE_MAP[oldType].label} → ${UPDATE_TYPE_MAP[type].label}`,
        { oldValue: UPDATE_TYPE_MAP[oldType].label, newValue: UPDATE_TYPE_MAP[type].label }
      )
      const newState = {
        ...state,
        comics: updatedComics,
        nextUpdateTypes: { ...state.nextUpdateTypes, [comicId]: type }
      }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  },

  addHiatus: (comicId, weeksCount, reason) => {
    const record: HiatusRecord = {
      id: generateId(),
      comicId,
      startWeek: getWeekKey(),
      weeksCount,
      reason,
      createdAt: Date.now()
    }
    set((state) => {
      let updatedComics = state.comics.map((c) =>
        c.id === comicId ? { ...c, hiatalRecords: [...c.hiatalRecords, record] } : c
      )
      updatedComics = addActivityLog(
        updatedComics,
        comicId,
        'hiatus',
        `记录休刊 ${weeksCount} 周${reason ? `: ${reason}` : ''}`
      )
      const newState = { ...state, comics: updatedComics }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
    console.log('[Store] Added hiatus for comic:', comicId, weeksCount, 'weeks')
  },

  getComicsByWeekday: (weekday, targetDate) => {
    const state = get()
    const date = targetDate || dayjs()
    return state.comics
      .filter((c) => {
        const hasWeeklyMatch = c.schedule.type === 'weekly' || c.schedule.type === 'biweekly'
          ? c.weekday === weekday
          : isScheduledToUpdate(c.schedule, date)
        return hasWeeklyMatch
      })
      .map((c) => {
        const hiatusStatus = isComicOnHiatusByDate(c.hiatalRecords, c.weekday, date)
        const { resumesTomorrow } = getHiatusStatus(c.hiatalRecords, c.weekday)
        const scheduled = isScheduledToUpdate(c.schedule, date)
        return {
          ...c,
          isOnHiatus: hiatusStatus,
          resumesTomorrow,
          scheduledDate: scheduled ? date.format('YYYY-MM-DD') : null
        }
      })
      .sort((a, b) => a.updateTime.localeCompare(b.updateTime))
  },

  getTodayComics: () => {
    const state = get()
    const today = getCurrentWeekday()
    const todayDate = dayjs()

    return state.comics
      .filter((c) => isScheduledToUpdate(c.schedule, todayDate))
      .map((c) => {
        const { isOnHiatus, resumesTomorrow, resumeDate } = getHiatusStatus(c.hiatalRecords, c.weekday)

        let updateType: UpdateType = state.nextUpdateTypes[c.id] || 'main'
        if (isOnHiatus) {
          updateType = 'hiatus'
        }

        const isRead = get().isComicReadThisWeek(c.id) && !isOnHiatus

        return {
          ...c,
          updateType,
          isRead,
          isOnHiatus,
          resumesTomorrow,
          scheduledDate: todayDate.format('YYYY-MM-DD')
        }
      })
      .sort((a, b) => {
        if (a.isOnHiatus !== b.isOnHiatus) return a.isOnHiatus ? 1 : -1
        return a.updateTime.localeCompare(b.updateTime)
      })
  },

  getWeeklyProgress: () => {
    const state = get()
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      return dayjs().startOf('isoWeek').add(i, 'day')
    });

    let total = 0
    let read = 0
    const byPlatform: Record<string, number> = {}
    const byWeekday: Record<number, number> = {}

    weekDates.forEach((date) => {
      const weekday = date.isoWeekday()
      state.comics.forEach((comic) => {
        if (isScheduledToUpdate(comic.schedule, date)) {
          const isOnHiatus = isComicOnHiatusByDate(comic.hiatalRecords, comic.weekday, date)
          if (!isOnHiatus) {
            total++
            byPlatform[comic.platform] = (byPlatform[comic.platform] || 0) + 1
            byWeekday[weekday] = (byWeekday[weekday] || 0) + 1
            if (get().isComicReadThisWeek(comic.id)) {
              read++
            }
          }
        }
      })
    })

    return { total, read, unread: total - read, byPlatform, byWeekday }
  },

  getComicById: (id) => {
    return get().comics.find((c) => c.id === id)
  },

  toggleFavorite: (id) => {
    set((state) => {
      const comic = state.comics.find((c) => c.id === id)
      if (!comic) return state

      const newIsFavorite = !comic.isFavorite
      let updatedComics = addActivityLog(
        state.comics,
        id,
        newIsFavorite ? 'favorite_on' : 'favorite_off',
        newIsFavorite ? '加入收藏' : '取消收藏'
      )
      updatedComics = updatedComics.map((c) =>
        c.id === id ? { ...c, isFavorite: newIsFavorite } : c
      )
      const newState = { ...state, comics: updatedComics }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  },

  updateCurrentChapter: (id, chapter) => {
    set((state) => {
      const comic = state.comics.find((c) => c.id === id)
      let updatedComics = state.comics.map((c) =>
        c.id === id ? { ...c, currentChapter: chapter } : c
      )
      if (comic && comic.currentChapter !== chapter) {
        updatedComics = addActivityLog(
          updatedComics,
          id,
          'chapter_change',
          `话数: ${comic.currentChapter} → ${chapter}`,
          { oldValue: String(comic.currentChapter), newValue: String(chapter), chapter }
        )
      }
      const newState = { ...state, comics: updatedComics }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  },

  addSpecialDate: (comicId, dateStr) => {
    set((state) => {
      const comic = state.comics.find((c) => c.id === comicId)
      if (!comic) return state

      const newSpecialDates = comic.schedule.specialDates || []
      if (!newSpecialDates.includes(dateStr)) {
        newSpecialDates.push(dateStr)
      }
      const newSchedule: UpdateSchedule = {
        ...comic.schedule,
        specialDates: newSpecialDates.sort()
      }

      let updatedComics = addActivityLog(
        state.comics,
        comicId,
        'update_type',
        `添加临时加更: ${dateStr}`,
        { newValue: dateStr }
      )
      updatedComics = updatedComics.map((c) =>
        c.id === comicId ? { ...c, schedule: newSchedule } : c
      )
      const newState = { ...state, comics: updatedComics }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  },

  getActivityLogs: (comicId) => {
    const comic = get().comics.find((c) => c.id === comicId)
    return comic?.activityLogs || []
  },

  getComicsForWeek: () => {
    const state = get()
    const weekDates = getWeekDates()
    const results: ComicWithHiatusStatus[] = []

    weekDates.forEach(({ weekday, date }) => {
      state.comics.forEach((comic) => {
        if (isScheduledToUpdate(comic.schedule, date)) {
          const isOnHiatus = isComicOnHiatusByDate(comic.hiatalRecords, comic.weekday, date)
          const { resumesTomorrow } = getHiatusStatus(comic.hiatalRecords, comic.weekday)
          const isRead = state.isComicReadThisWeek(comic.id)
          const updateType = state.nextUpdateTypes[comic.id] || 'main'

          results.push({
            ...comic,
            updateType: isOnHiatus ? 'hiatus' : updateType,
            isRead,
            isOnHiatus,
            resumesTomorrow,
            scheduledDate: date.format('YYYY-MM-DD')
          })
        }
      })
    })

    return results.sort((a, b) => {
      if (a.scheduledDate && b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate) || a.updateTime.localeCompare(b.updateTime)
      }
      return a.updateTime.localeCompare(b.updateTime)
    })
  }
}))
