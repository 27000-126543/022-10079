export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type UpdateType = 'main' | 'extra' | 'hiatus' | 'bonus'

export type Platform = '哔哩哔哩漫画' | '快看漫画' | '腾讯动漫' | '咚漫漫画' | '微博动漫' | '其他'

export interface HiatusRecord {
  id: string
  comicId: string
  startWeek: string
  weeksCount: number
  reason?: string
  createdAt: number
}

export interface Comic {
  id: string
  title: string
  platform: Platform
  weekday: Weekday
  updateTime: string
  currentChapter: number
  totalChapter?: number
  lastReadAt?: number
  isFavorite: boolean
  hiatalRecords: HiatusRecord[]
  coverColor: string
  createdAt: number
}

export interface TodayComic extends Comic {
  updateType: UpdateType
  isRead: boolean
  chapterTitle?: string
  isOnHiatus: boolean
  resumesTomorrow: boolean
}

export interface ComicWithHiatusStatus extends Comic {
  isOnHiatus: boolean
  resumesTomorrow: boolean
}

export const WEEKDAY_MAP: Record<Weekday, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日'
}

export const UPDATE_TYPE_MAP: Record<UpdateType, { label: string; color: string }> = {
  main: { label: '正篇', color: '#7B5CFF' },
  extra: { label: '番外', color: '#FF7BAC' },
  hiatus: { label: '休刊', color: '#FFA940' },
  bonus: { label: '加更', color: '#52C41A' }
}

export const PLATFORM_LIST: Platform[] = [
  '哔哩哔哩漫画',
  '快看漫画',
  '腾讯动漫',
  '咚漫漫画',
  '微博动漫',
  '其他'
]

export const COVER_COLORS = [
  '#7B5CFF',
  '#FF7BAC',
  '#5CC8FF',
  '#52C41A',
  '#FFA940',
  '#FF5C5C',
  '#13C2C2',
  '#722ED1'
]
