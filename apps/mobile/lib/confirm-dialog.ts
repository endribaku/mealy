import { Alert, Platform } from 'react-native'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  destructive?: boolean
}

/**
 * Cross-platform confirmation dialog.
 * Returns Promise<boolean> — true if confirmed, false if cancelled.
 * Uses Alert.alert on iOS/Android, window.confirm on web.
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  const { title, message, confirmText = 'OK', destructive = false } = options

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`))
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ])
  })
}
