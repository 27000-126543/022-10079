import { create } from 'zustand'
import type { Comic, HiatusRecord, Weekday, UpdateType, TodayComic, Platform } from '@/types/comic'
import { mockComics } from '@/data/mockComics'
import { generateId, getCurrentWeekday, getWeekKey, addWeeks, isSameWeek } from '@/utils/date'

interface ComicState {
  comics: Comic[]
  readRecords: Record<string, boolean>
  nextUpdateTypes: Record<string, UpdateType>

  addComic: (data: Omit<Comic, 'id' | 'createdAt' | 'hiatalRecords' | 'isFavorite'>) => void
  updateComic: (id: string, data: Partial<Comic>) => void
  deleteComic: (id: string) => void
  markAsRead: (comicId: string) => void
  unmarkAsRead: (comicId: string) => void
  setNextUpdateType: (comicId: string, type: UpdateType) => void
  addHiatus: (comicId: string, weeksCount: number, reason?: string) => void
  getComicsByWeekday: (weekday: Weekday) => Comic[]
  getTodayComics: () => TodayComic[]
  getComicById: (id: string) => Comic | undefined
  toggleFavorite: (id: string) => void
  updateCurrentChapter: (id: string, chapter: number) => void
}

export const useComicStore = create<ComicState>((set, get) => ({
  comics: mockComics,
  readRecords: {},
  nextUpdateTypes: {},

  addComic: (data) => {
    const newComic: Comic = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      hiatalRecords: [],
      isFavorite: false
    }
    set((state) => ({
      comics: [...state.comics, newComic]
    }))
  },

  updateComic: (id, data) => {
    set((state) => ({
      comics: state.comics.map((c) => (c.id === id ? { ...c, ...data } : c))
    }))
  },

  deleteComic: (id) => {
    set((state) => ({
      comics: state.comics.filter((c) => c.id !== id)
    }))
  },

  markAsRead: (comicId) => {
    set((state) => ({
      readRecords: { ...state.readRecords, [comicId]: true }
    }))
    const comic = get().getComicById(comicId)
    if (comic) {
      get().updateComic(comicId, {
        currentChapter: comic.currentChapter + 1,
        lastReadAt: Date.now()
      })
    }
  },

  unmarkAsRead: (comicId) => {
    set((state) => {
      const newRecords = { ...state.readRecords }
      delete newRecords[comicId]
      return { readRecords: newRecords }
    })
  },

  setNextUpdateType: (comicId, type) => {
    set((state) => ({
      nextUpdateTypes: { ...state.nextUpdateTypes, [comicId]: type }
    }))
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
    set((state) => ({
      comics: state.comics.map((c) =>
        c.id === comicId ? { ...c, hiatalRecords: [...c.hiatalRecords, record] } : c
      )
    }))
  },

  getComicsByWeekday: (weekday) => {
    const state = get()
    return state.comics
      .filter((c) => {
        const currentWeek = getWeekKey()
        const isOnHiatus = c.hiatalRecords.some((h) => {
          for (let i = 0; i < h.weeksCount; i++) {
            if (isSameWeek(currentWeek, addWeeks(h.startWeek, i))) {
              return true
            }
          }
          return false
        })
        return c.weekday === weekday && !isOnHiatus
      })
      .sort((a, b) => a.updateTime.localeCompare(b.updateTime))
  },

  getTodayComics: () => {
    const state = get()
    const today = getCurrentWeekday()
    const currentWeek = getWeekKey()

    return state.comics
      .filter((c) => c.weekday === today)
      .map((c) => {
        const isOnHiatus = c.hiatalRecords.some((h) => {
          for (let i = 0; i < h.weeksCount; i++) {
            if (isSameWeek(currentWeek, addWeeks(h.startWeek, i))) {
              return true
            }
          }
          return false
        })

        let updateType: UpdateType = state.nextUpdateTypes[c.id] || 'main'
        if (isOnHiatus) {
          updateType = 'hiatus'
        }

        return {
          ...c,
          updateType,
          isRead: !!state.readRecords[c.id]
        }
      })
      .sort((a, b) => a.updateTime.localeCompare(b.updateTime))
  },

  getComicById: (id) => {
    return get().comics.find((c) => c.id === id)
  },

  toggleFavorite: (id) => {
    set((state) => ({
      comics: state.comics.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    }))
  },

  updateCurrentChapter: (id, chapter) => {
    set((state) => ({
      comics: state.comics.map((c) => (c.id === id ? { ...c, currentChapter: chapter } : c))
    }))
  }
}))
