import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '📚',
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.emoji}>{emoji}</Text>
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
      {actionText && (
        <Button
          className={styles.actionBtn}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </View>
  )
}

export default EmptyState
