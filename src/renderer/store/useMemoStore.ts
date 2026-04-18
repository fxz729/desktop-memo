import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Memo, Category, Shortcuts, ThemeName, DisplayMode } from '../../shared/types'

interface MemoStore {
  memos: Memo[]
  categories: Category[]
  activeCategory: string
  isAddModalOpen: boolean
  isSettingsOpen: boolean
  editingMemo: Memo | null
  settings: {
    autoStart: boolean
    opacity: number
    alwaysOnTop: boolean
    edgeHide: boolean
    shortcuts: Shortcuts
    displayMode: DisplayMode
    theme: ThemeName
    darkMode: boolean
    notificationSound: boolean
  }

  // Actions
  loadAll: () => Promise<void>
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => Promise<void>
  updateMemo: (id: string, updates: Partial<Memo>) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
  completeMemo: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  setActiveCategory: (id: string) => void
  openAddModal: (memo?: Memo) => void
  closeAddModal: () => void
  openSettings: () => void
  closeSettings: () => void
  updateSettings: (updates: Partial<MemoStore['settings']>) => Promise<void>
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: [],
  categories: [],
  activeCategory: 'all',
  isAddModalOpen: false,
  isSettingsOpen: false,
  editingMemo: null,
  settings: {
    autoStart: false,
    opacity: 0.92,
    alwaysOnTop: false,
    edgeHide: true,
    shortcuts: {
      toggleWindow: 'CommandOrControl+Shift+M',
      newMemo: 'CommandOrControl+N'
    },
    displayMode: 'standard',
    theme: 'jade',
    darkMode: false,
    notificationSound: true
  },

  loadAll: async () => {
    const [memos, categories, settings] = await Promise.all([
      window.electronAPI.memo.getAll(),
      window.electronAPI.category.getAll(),
      window.electronAPI.settings.get()
    ])

    // 兼容旧版本 compactMode 迁移到 displayMode
    let displayMode: DisplayMode = 'standard'
    if (settings.displayMode) {
      displayMode = settings.displayMode
    } else if (settings.compactMode === true) {
      displayMode = 'compact'
    }

    set({
      memos,
      categories,
      settings: {
        ...get().settings,
        ...settings,
        displayMode,
        shortcuts: settings.shortcuts || get().settings.shortcuts,
        theme: settings.theme || get().settings.theme
      }
    })
  },

  addMemo: async (memoData) => {
    const memo: Memo = {
      ...memoData,
      id: uuidv4(),
      createdAt: Date.now(),
      completed: false
    }
    await window.electronAPI.memo.create(memo)
    set(state => ({ memos: [...state.memos, memo] }))
  },

  updateMemo: async (id, updates) => {
    await window.electronAPI.memo.update(id, updates)
    set(state => ({
      memos: state.memos.map(m => m.id === id ? { ...m, ...updates } : m)
    }))
  },

  deleteMemo: async (id) => {
    await window.electronAPI.memo.delete(id)
    set(state => ({ memos: state.memos.filter(m => m.id !== id) }))
  },

  completeMemo: async (id) => {
    await window.electronAPI.memo.complete(id)
    set(state => ({
      memos: state.memos.map(m =>
        m.id === id ? { ...m, completed: true, completedAt: Date.now() } : m
      )
    }))
  },

  addCategory: async (catData) => {
    const category: Category = { ...catData, id: uuidv4() }
    await window.electronAPI.category.create(category)
    set(state => ({ categories: [...state.categories, category] }))
  },

  updateCategory: async (id, updates) => {
    await window.electronAPI.category.update(id, updates)
    set(state => ({
      categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },

  deleteCategory: async (id) => {
    await window.electronAPI.category.delete(id)
    set(state => ({ categories: state.categories.filter(c => c.id !== id) }))
  },

  setActiveCategory: (id) => set({ activeCategory: id }),

  openAddModal: (memo) => set({ isAddModalOpen: true, editingMemo: memo || null }),

  closeAddModal: () => set({ isAddModalOpen: false, editingMemo: null }),

  openSettings: () => set({ isSettingsOpen: true }),

  closeSettings: () => set({ isSettingsOpen: false }),

  updateSettings: async (updates) => {
    const current = get().settings
    const newSettings = { ...current, ...updates }
    set({ settings: newSettings })
    await window.electronAPI.settings.save({
      autoStart: newSettings.autoStart,
      windowBounds: { x: 0, y: 0, width: 320, height: 580 },
      opacity: newSettings.opacity,
      alwaysOnTop: newSettings.alwaysOnTop,
      edgeHide: newSettings.edgeHide,
      shortcuts: newSettings.shortcuts,
      displayMode: newSettings.displayMode,
      theme: newSettings.theme,
      darkMode: newSettings.darkMode,
      notificationSound: newSettings.notificationSound
    })
  }
}))
