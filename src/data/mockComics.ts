import type { Comic, ActivityLog } from '@/types/comic'
import { generateId, getWeekKey } from '@/utils/date'

const createActivityLog = (comicId: string, type: ActivityLog['type'], detail: string, chapter?: number): ActivityLog => ({
  id: generateId(),
  comicId,
  type,
  timestamp: Date.now() - Math.floor(Math.random() * 30 * 86400000),
  detail,
  chapter
})

export const mockComics: Comic[] = [
  {
    id: generateId(),
    title: '咒术回战',
    platform: '哔哩哔哩漫画',
    weekday: 3,
    updateTime: '19:00',
    currentChapter: 245,
    totalChapter: 250,
    lastReadAt: Date.now() - 86400000,
    isFavorite: true,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 3 },
    coverColor: '#7B5CFF',
    createdAt: Date.now() - 30 * 86400000
  },
  {
    id: generateId(),
    title: '间谍过家家',
    platform: '哔哩哔哩漫画',
    weekday: 1,
    updateTime: '22:00',
    currentChapter: 89,
    lastReadAt: Date.now() - 2 * 86400000,
    isFavorite: true,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 1 },
    coverColor: '#FF7BAC',
    createdAt: Date.now() - 20 * 86400000
  },
  {
    id: generateId(),
    title: '鬼灭之刃 番外篇',
    platform: '哔哩哔哩漫画',
    weekday: 5,
    updateTime: '18:00',
    currentChapter: 12,
    isFavorite: false,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'biweekly', weekday: 5, biweekOdd: true },
    coverColor: '#5CC8FF',
    createdAt: Date.now() - 15 * 86400000
  },
  {
    id: generateId(),
    title: '海贼王',
    platform: '腾讯动漫',
    weekday: 4,
    updateTime: '12:00',
    currentChapter: 1112,
    isFavorite: true,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 4 },
    coverColor: '#52C41A',
    createdAt: Date.now() - 60 * 86400000
  },
  {
    id: generateId(),
    title: '进击的巨人',
    platform: '咚漫漫画',
    weekday: 6,
    updateTime: '20:00',
    currentChapter: 139,
    totalChapter: 139,
    isFavorite: false,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'monthly', monthDay: 15 },
    coverColor: '#FFA940',
    createdAt: Date.now() - 90 * 86400000
  },
  {
    id: generateId(),
    title: '电锯人',
    platform: '哔哩哔哩漫画',
    weekday: 2,
    updateTime: '21:00',
    currentChapter: 168,
    isFavorite: true,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 2 },
    coverColor: '#FF5C5C',
    createdAt: Date.now() - 25 * 86400000
  },
  {
    id: generateId(),
    title: '葬送的芙莉莲',
    platform: '哔哩哔哩漫画',
    weekday: 7,
    updateTime: '10:00',
    currentChapter: 125,
    isFavorite: true,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 7 },
    coverColor: '#13C2C2',
    createdAt: Date.now() - 10 * 86400000
  },
  {
    id: generateId(),
    title: '我推的孩子',
    platform: '快看漫画',
    weekday: 3,
    updateTime: '17:00',
    currentChapter: 155,
    isFavorite: false,
    hiatalRecords: [],
    activityLogs: [],
    schedule: { type: 'weekly', weekday: 3 },
    coverColor: '#722ED1',
    createdAt: Date.now() - 5 * 86400000
  }
]

mockComics.forEach((comic) => {
  const logs: ActivityLog[] = [
    createActivityLog(comic.id, 'add', `开始追更《${comic.title}》`),
    createActivityLog(comic.id, 'read', `看完第 ${comic.currentChapter - 2} 话`, comic.currentChapter - 2),
    createActivityLog(comic.id, 'read', `看完第 ${comic.currentChapter - 1} 话`, comic.currentChapter - 1),
    createActivityLog(comic.id, 'read', `看完第 ${comic.currentChapter} 话`, comic.currentChapter)
  ]
  if (comic.isFavorite) {
    logs.push(createActivityLog(comic.id, 'favorite_on', '加入收藏'))
  }
  comic.activityLogs = logs.sort((a, b) => b.timestamp - a.timestamp)
})
