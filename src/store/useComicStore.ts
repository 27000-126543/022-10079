import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type {
  Comic,
  HiatusRecord,
  Weekday,
  UpdateType,
  TodayComic,
  ComicWithHiatusStatus
} from '@/types/comic'
import { mockComics } from '@/data/mockComics'
import {
  generateId,
  getCurrentWeekday,
  getWeekKey,
  getHiatusStatus,
  isComicOnHiatusByDate
} from '@/utils/date'
import dayjs from 'dayjs'

const STORAGE_KEY = 'comic_tracker_data_v1'

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

interface ComicState extends PersistedState {
  hydrate: () => void
  addComic: (data: Omit<Comic, 'id' | 'createdAt' | 'hiatalRecords' | 'isFavorite'>) => void
  updateComic: (id: string, data: Partial<Comic>) => void
  deleteComic: (id: string) => void
  markAsRead: (comicId: string) => void
  unmarkAsRead: (comicId: string) => void
  setNextUpdateType: (comicId: string, type: UpdateType) => void
  addHiatus: (comicId: string, weeksCount: number, reason?: string) => void
  getComicsByWeekday: (weekday: Weekday, targetDate?: dayjs.Dayjs) => ComicWithHiatusStatus[]
  getTodayComics: () => TodayComic[]
  getComicById: (id: string) => Comic | undefined
  toggleFavorite: (id: string) => void
  updateCurrentChapter: (id: string, chapter: number) => void
  isComicReadThisWeek: (comicId: string) => boolean
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
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      hiatalRecords: [],
      isFavorite: false
    }
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
      const newState = {
        ...state,
        comics: state.comics.map((c) => (c.id === id ? { ...c, ...data } : c))
      }
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
      get().updateComic(comicId, {
        currentChapter: comic.currentChapter + 1,
        lastReadAt: Date.now()
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
      const newState = {
        ...state,
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
      const newState = {
        ...state,
        comics: state.comics.map((c) =>
          c.id === comicId ? { ...c, hiatalRecords: [...c.hiatalRecords, record] } : c
        )
      }
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
      .filter((c) => c.weekday === weekday)
      .map((c) => {
        const hiatusStatus = isComicOnHiatusByDate(c.hiatalRecords, c.weekday, date)
        const { resumesTomorrow } = getHiatusStatus(c.hiatalRecords, c.weekday)
        return {
          ...c,
          isOnHiatus: hiatusStatus,
          resumesTomorrow
        }
      })
      .sort((a, b) => a.updateTime.localeCompare(b.updateTime))
  },

  getTodayComics: () => {
    const state = get()
    const today = getCurrentWeekday()
    const todayDate = dayjs()

    return state.comics
      .filter((c) => c.weekday === today)
      .map((c) => {
        const { isOnHiatus, resumesTomorrow } = getHiatusStatus(c.hiatalRecords, c.weekday)

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
          resumesTomorrow
        }
      })
      .sort((a, b) => {
        if (a.isOnHiatus !== b.isOnHiatus) return a.isOnHiatus ? 1 : -1
        return a.updateTime.localeCompare(b.updateTime)
      })
  },

  getComicById: (id) => {
    return get().comics.find((c) => c.id === id)
  },

  toggleFavorite: (id) => {
    set((state) => {
      const newState = {
        ...state,
        comics: state.comics.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
      }
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
      const newState = {
        ...state,
        comics: state.comics.map((c) => (c.id === id ? { ...c, currentChapter: chapter } : c))
      }
      saveToStorage({
        comics: newState.comics,
        readRecords: newState.readRecords,
        nextUpdateTypes: newState.nextUpdateTypes
      })
      return newState
    })
  }
}))
