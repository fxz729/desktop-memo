import Store from 'electron-store'
import { Memo, Category, AppSettings } from '../shared/types'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work',   name: '工作/学习', color: 'blue',   icon: '💼', isDefault: true },
  { id: 'life',   name: '生活/购物', color: 'green',  icon: '🛒', isDefault: true },
  { id: 'health', name: '健康/运动', color: 'amber',   icon: '🏃', isDefault: true }
]

const DEFAULT_SETTINGS: AppSettings = {
  autoStart: false,
  windowBounds: { x: 0, y: 0, width: 320, height: 580 },
  opacity: 0.92,
  alwaysOnTop: false,
  edgeHide: true,
  shortcuts: {
    toggleWindow: 'CommandOrControl+Shift+M',
    newMemo: 'CommandOrControl+N'
  },
  displayMode: 'standard',
  theme: 'jade'
}

interface StoreSchema {
  memos: Memo[]
  categories: Category[]
  settings: AppSettings
}

let store: Store<StoreSchema>

export function initStore(): void {
  store = new Store<StoreSchema>({
    name: 'desktop-memo-data',
    defaults: {
      memos: [],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS
    }
  })
}

// ============ Memos ============
export function getMemos(): Memo[] {
  return store.get('memos', [])
}

export function saveMemos(memos: Memo[]): void {
  store.set('memos', memos)
}

export function addMemo(memo: Memo): void {
  const memos = getMemos()
  memos.push(memo)
  store.set('memos', memos)
}

export function updateMemo(id: string, updates: Partial<Memo>): Memo | null {
  const memos = getMemos()
  const index = memos.findIndex(m => m.id === id)
  if (index === -1) return null
  memos[index] = { ...memos[index], ...updates }
  store.set('memos', memos)
  return memos[index]
}

export function deleteMemo(id: string): void {
  const memos = getMemos().filter(m => m.id !== id)
  store.set('memos', memos)
}

// ============ Categories ============
export function getCategories(): Category[] {
  return store.get('categories', DEFAULT_CATEGORIES)
}

export function saveCategories(categories: Category[]): void {
  store.set('categories', categories)
}

export function addCategory(category: Category): void {
  const categories = getCategories()
  categories.push(category)
  store.set('categories', categories)
}

export function deleteCategory(id: string): void {
  const categories = getCategories().filter(c => c.id !== id)
  store.set('categories', categories)
}

// ============ Settings ============
export function getSettings(): AppSettings {
  return store.get('settings', DEFAULT_SETTINGS)
}

export function saveSettings(settings: AppSettings): void {
  store.set('settings', settings)
}
