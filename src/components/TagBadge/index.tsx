import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { UpdateType } from '@/types/comic'
import { UPDATE_TYPE_MAP } from '@/types/comic'

interface TagBadgeProps {
  type?: UpdateType | 'platform'
  text?: string
  color?: string
}

const TagBadge: React.FC<TagBadgeProps> = ({ type, text, color }) => {
  const getClassName = () => {
    switch (type) {
      case 'main':
        return styles.tagMain
      case 'extra':
        return styles.tagExtra
      case 'hiatus':
        return styles.tagHiatus
      case 'bonus':
        return styles.tagBonus
      case 'platform':
        return styles.tagPlatform
      default:
        return ''
    }
  }

  const displayText = type && type !== 'platform' ? UPDATE_TYPE_MAP[type].label : text || ''

  const customStyle = color && !type ? { backgroundColor: `${color}1A`, color } : undefined

  return (
    <View className={classnames(styles.tagBadge, getClassName())} style={customStyle}>
      <Text>{displayText}</Text>
    </View>
  )
}

export default TagBadge
