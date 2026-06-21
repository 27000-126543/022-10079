export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type UpdateType = 'main' | 'extra' | 'hiatus' | 'bonus'

export type Platform = '哔哩哔哩漫画' | '快看漫画' | '腾讯动漫' | '咚漫漫画' | '微博动漫' | '其他'

export type ScheduleType = 'weekly' | 'biweekly' | 'monthly' | 'special'

export interface UpdateSchedule {
  type: ScheduleType
  weekday?: Weekday
  biweekOdd?: boolean
  monthDay?: number
  specialDates?: string[]
}

export type ActivityType =
  | 'add'
  | 'read'
  | 'chapter_change'
  | 'favorite_on'
  | 'favorite_off'
  | 'hiatus'
  | 'resume'
  | 'update_type'
  | 'edit'

export interface ActivityLog {
  id: string
  comicId: string
  type: ActivityType
  timestamp: number
  detail: string
  oldValue?: string
  newValue?: string
  chapter?: number
}

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
  activityLogs: ActivityLog[]
  schedule: UpdateSchedule
  coverColor: string
  createdAt: number
}

export interface TodayComic extends Comic {
  updateType: UpdateType
  isRead: boolean
  chapterTitle?: string
  isOnHiatus: boolean
  resumesTomorrow: boolean
  scheduledDate: string | null
}

export interface ComicWithHiatusStatus extends Comic {
  isOnHiatus: boolean
  resumesTomorrow: boolean
  scheduledDate: string | null
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

export const SCHEDULE_TYPE_MAP: Record<ScheduleType, { label: string; desc: string }> = {
  weekly: { label: '每周更新', desc: '固定每周某一天' },
  biweekly: { label: '双周更新', desc: '隔周更新一次' },
  monthly: { label: '每月更新', desc: '固定每月某天' },
  special: { label: '临时加更', desc: '指定特定日期' }
}

export const UPDATE_TYPE_MAP: Record<UpdateType, { label: string; color: string }> = {
  main: { label: '正篇', color: '#7B5CFF' },
  extra: { label: '番外', color: '#FF7BAC' },
  hiatus: { label: '休刊', color: '#FFA940' },
  bonus: { label: '加更', color: '#52C41A' }
}

export const ACTIVITY_TYPE_MAP: Record<ActivityType, { label: string; emoji: string }> = {
  add: { label: '开始追更', emoji: '📚' },
  read: { label: '看完一话', emoji: '✅' },
  chapter_change: { label: '修改话数', emoji: '📝' },
  favorite_on: { label: '加入收藏', emoji: '❤️' },
  favorite_off: { label: '取消收藏', emoji: '🤍' },
  hiatus: { label: '记录休刊', emoji: '⏸️' },
  resume: { label: '恢复更新', emoji: '▶️' },
  update_type: { label: '更新类型', emoji: '🏷️' },
  edit: { label: '编辑信息', emoji: '✏️' }
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

export const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
