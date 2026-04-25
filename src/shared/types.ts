// Shared types used by both main and renderer processes

export type ThemeName = 'jade' | 'aurora' | 'twilight' | 'rose' | 'midnight'

// 显示模式
export type DisplayMode = 'standard' | 'compact' | 'mini' | 'ultra-mini'

// 模式配置
export interface DisplayModeConfig {
  mode: DisplayMode
  name: string
  windowBounds: { width: number; height: number }
  maxDisplayCount: number
  showCategoryTabs: boolean
  showMemoActions: boolean
  showAddButton: boolean
  title: string
  // 贴边隐藏时的窄条配置
  stripWidth: number      // 左侧/右侧隐藏时的宽度
  stripHeight: number     // 顶部/底部隐藏时的高度
  stripDisplayCount: number  // 窄条中显示的备忘录数量
}

// 所有模式的预设配置
export const DISPLAY_MODE_CONFIGS: Record<DisplayMode, DisplayModeConfig> = {
  standard: {
    mode: 'standard',
    name: '标准模式',
    windowBounds: { width: 320, height: 580 },
    maxDisplayCount: 50,
    showCategoryTabs: true,
    showMemoActions: true,
    showAddButton: true,
    title: '备忘录',
    stripWidth: 12,        // 左侧/右侧显示12px宽的窄条
    stripHeight: 12,       // 顶部/底部显示12px高的窄条
    stripDisplayCount: 3   // 窄条中显示3条备忘录
  },
  compact: {
    mode: 'compact',
    name: '紧凑模式',
    windowBounds: { width: 300, height: 320 },
    maxDisplayCount: 5,
    showCategoryTabs: false,
    showMemoActions: false,
    showAddButton: true,
    title: '快速备忘录',
    stripWidth: 9,
    stripHeight: 9,
    stripDisplayCount: 2
  },
  mini: {
    mode: 'mini',
    name: '迷你模式',
    windowBounds: { width: 260, height: 180 },
    maxDisplayCount: 3,
    showCategoryTabs: false,
    showMemoActions: false,
    showAddButton: false,
    title: '迷你',
    stripWidth: 6,
    stripHeight: 6,
    stripDisplayCount: 1
  },
  'ultra-mini': {
    mode: 'ultra-mini',
    name: '极简模式',
    windowBounds: { width: 200, height: 100 },
    maxDisplayCount: 2,
    showCategoryTabs: false,
    showMemoActions: false,
    showAddButton: false,
    title: '..',
    stripWidth: 4,
    stripHeight: 4,
    stripDisplayCount: 1
  }
}

export interface Memo {
  id: string
  title: string
  categoryId: string
  reminderAt?: string
  location?: string
  notes?: string
  completed: boolean
  completedAt?: number
  createdAt: number
  pinned?: boolean  // 置顶功能
  order?: number    // 排序权重
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  isDefault?: boolean
}

export interface Shortcuts {
  toggleWindow: string   // 显示/隐藏主界面
  newMemo: string        // 新建备忘录
}

// 贴边隐藏设置
export interface EdgeHideSettings {
  enabled: boolean
  directions: ('left' | 'right' | 'top' | 'bottom')[]  // 启用哪些方向
  threshold: number    // 灵敏度：3-15px
  hideDelay: number    // 隐藏延迟：500-1500ms
}

export interface AppSettings {
  autoStart: boolean
  silentStartup?: boolean
  windowBounds: { x: number; y: number; width: number; height: number }
  opacity: number
  alwaysOnTop: boolean
  edgeHide: boolean
  edgeHideSettings?: EdgeHideSettings  // 贴边隐藏详细设置
  shortcuts: Shortcuts
  displayMode: DisplayMode
  theme: ThemeName
  darkMode?: boolean      // 深色模式
  notificationSound?: boolean  // 通知声音
}
