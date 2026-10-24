export type ColorScheme = 'light' | 'dark'

export interface ThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
  bottom_bar_bg_color?: string
  section_separator_color?: string
}

export interface SafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

export interface BottomButton {
  setText: (text: string) => void
  show: () => void
  hide: () => void
  enable: () => void
  disable: () => void
  showProgress: (leaveActive?: boolean) => void
  hideProgress: () => void
  onClick: (callback: () => void) => void
  offClick: (callback: () => void) => void
  isVisible: boolean
  isEnabled: boolean
  isActive: boolean
  text: string
  color: string
  textColor: string
}

export interface WebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: { id: number; first_name: string; is_premium?: boolean; photo_url?: string }
    chat?: { id: number; type: string; title: string }
    auth_date: number
    hash: string
    start_param?: string
    chat_type?: string
    chat_instance?: string
  }
  version: string
  platform: string
  colorScheme: ColorScheme
  themeParams: ThemeParams
  isActive: boolean
  isExpanded: boolean
  isFullscreen: boolean
  viewportHeight: number
  viewportStableHeight: number
  safeAreaInset: SafeAreaInset
  contentSafeAreaInset: SafeAreaInset
  headerColor: string
  backgroundColor: string
  bottomBarColor: string
  ready: () => void
  expand: () => void
  close: () => void
  isVersionAtLeast: (version: string) => boolean
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setBottomBarColor: (color: string) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  enableVerticalSwipes: () => void
  disableVerticalSwipes: () => void
  requestFullscreen: () => void
  exitFullscreen: () => void
  lockOrientation: () => void
  unlockOrientation: () => void
  addToHomeScreen: () => void
  checkHomeScreenStatus: (callback?: (status: string) => void) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{ type: string; text?: string; id?: string }>
  }, callback?: (buttonId: string | null) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  readTextFromClipboard: (callback?: (text: string | null) => void) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  openInvoice: (url: string, callback?: (status: string) => void) => void
  shareToStory: (mediaUrl: string, params?: Record<string, unknown>) => void
  shareMessage: (msgId: number, callback?: (success: boolean) => void) => void
  downloadFile: (params: { url: string; file_name: string }, callback?: (accepted: boolean) => void) => void
  setEmojiStatus: (customEmojiId: string, params?: Record<string, unknown>, callback?: (success: boolean) => void) => void
  requestEmojiStatusAccess: (callback?: (granted: boolean) => void) => void
  hideKeyboard: () => void
  requestWriteAccess: (callback?: (status: string) => void) => void
  requestContact: (callback?: (status: string) => void) => void
  requestChat: (reqId: string, callback?: (success: boolean) => void) => void
  MainButton: BottomButton
  SecondaryButton: BottomButton
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  SettingsButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: object | null, success?: boolean) => void) => void
    getItem: (key: string, callback: (error: object | null, value: string) => void) => void
    getItems: (keys: string[], callback: (error: object | null, values: Record<string, string>) => void) => void
    removeItem: (key: string, callback?: (error: object | null, success?: boolean) => void) => void
    removeItems: (keys: string[], callback?: (error: object | null, success?: boolean) => void) => void
    getKeys: (callback: (error: object | null, keys: string[]) => void) => void
  }
  DeviceStorage: {
    setItem: (key: string, value: string, callback?: (error: object | null, success?: boolean) => void) => void
    getItem: (key: string, callback: (error: object | null, value: string | null) => void) => void
    removeItem: (key: string, callback?: (error: object | null, success?: boolean) => void) => void
    clear: (callback?: (error: object | null) => void) => void
  }
  SecureStorage: {
    setItem: (key: string, value: string, callback?: (error: object | null, success?: boolean) => void) => void
    getItem: (key: string, callback: (error: object | null, value: string | null) => void) => void
    restoreItem: (key: string, callback?: (error: object | null, value: string | null) => void) => void
    removeItem: (key: string, callback?: (error: object | null, success?: boolean) => void) => void
    clear: (callback?: (error: object | null) => void) => void
  }
  Accelerometer: {
    isStarted: boolean
    x: number
    y: number
    z: number
    start: (params?: { refresh_rate?: number }, callback?: (success: boolean) => void) => void
    stop: (callback?: (success: boolean) => void) => void
  }
  DeviceOrientation: {
    isStarted: boolean
    absolute: boolean
    alpha: number
    beta: number
    gamma: number
    start: (params?: { refresh_rate?: number; need_absolute?: boolean }, callback?: (success: boolean) => void) => void
    stop: (callback?: (success: boolean) => void) => void
  }
  Gyroscope: {
    isStarted: boolean
    x: number
    y: number
    z: number
    start: (params?: { refresh_rate?: number }, callback?: (success: boolean) => void) => void
    stop: (callback?: (success: boolean) => void) => void
  }
  LocationManager: {
    isInited: boolean
    isLocationAvailable: boolean
    isAccessRequested: boolean
    isAccessGranted: boolean
    init: (callback?: () => void) => void
    getLocation: (callback: (data: { latitude: number; longitude: number; altitude: number | null; course: number | null; speed: number | null } | null) => void) => void
    openSettings: () => void
  }
  BiometricManager: {
    isInited: boolean
    isBiometricAvailable: boolean
    biometricType: 'finger' | 'face' | 'unknown'
    isAccessRequested: boolean
    isAccessGranted: boolean
    isBiometricTokenSaved: boolean
    deviceId: string
    init: (callback?: () => void) => void
    requestAccess: (params: { reason?: string }, callback?: (granted: boolean) => void) => void
    authenticate: (params: { reason?: string }, callback?: (success: boolean, token?: string) => void) => void
    updateBiometricToken: (token: string, callback?: (updated: boolean) => void) => void
    openSettings: () => void
  }
  onEvent: (eventType: string, handler: () => void) => void
  offEvent: (eventType: string, handler: () => void) => void
}

declare global {
  interface Window {
    Telegram: { WebApp: WebApp }
  }
}

export function getWebApp(): WebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function getThemeParams(): ThemeParams {
  const wa = getWebApp()
  return wa?.themeParams || {}
}

export function applyThemeColors() {
  const wa = getWebApp()
  if (!wa) return
  const root = document.documentElement
  const tp = wa.themeParams
  if (tp.bg_color) root.style.setProperty('--tg-theme-bg-color', tp.bg_color)
  if (tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color)
  if (tp.button_color) root.style.setProperty('--tg-theme-button-color', tp.button_color)
  if (tp.button_text_color) root.style.setProperty('--tg-theme-button-text-color', tp.button_text_color)
}
