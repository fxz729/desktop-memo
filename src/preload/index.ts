import { contextBridge, ipcRenderer } from 'electron'
import { Memo, Category, AppSettings, DisplayMode } from '../shared/types'

export interface ElectronAPI {
  memo: {
    getAll: () => Promise<Memo[]>
    create: (memo: Memo) => Promise<Memo>
    update: (id: string, updates: Partial<Memo>) => Promise<Memo | null>
    delete: (id: string) => Promise<void>
    complete: (id: string) => Promise<Memo | null>
    export: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>
    import: () => Promise<{ success: boolean; imported?: { memos: number; categories: number }; canceled?: boolean; error?: string }>
  }
  category: {
    getAll: () => Promise<Category[]>
    create: (category: Category) => Promise<Category>
    update: (id: string, updates: Partial<Category>) => Promise<Category | null>
    delete: (id: string) => Promise<void>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (settings: AppSettings) => Promise<void>
    getAutoStartStatus: () => Promise<boolean>
    setAutoStart: (enable: boolean, silent?: boolean) => Promise<{ success: boolean; error?: string }>
    refreshShortcuts: () => Promise<void>
  }
  window: {
    setOpacity: (opacity: number) => Promise<void>
    setAlwaysOnTop: (onTop: boolean) => Promise<void>
    resetPosition: () => Promise<void>
    minimize: () => Promise<void>
    close: () => Promise<void>
    setBounds: (bounds: { width: number; height: number; x?: number; y?: number }) => Promise<void>
    setDisplayMode: (mode: DisplayMode) => Promise<void>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
  onEdgeHideChanged: (callback: (data: { isAutoHidden: boolean; edge: string | null; stripSize: number }) => void) => void
}

const api: ElectronAPI = {
  memo: {
    getAll: () => ipcRenderer.invoke('memo:getAll'),
    create: (memo) => ipcRenderer.invoke('memo:create', memo),
    update: (id, updates) => ipcRenderer.invoke('memo:update', id, updates),
    delete: (id) => ipcRenderer.invoke('memo:delete', id),
    complete: (id) => ipcRenderer.invoke('memo:complete', id),
    export: () => ipcRenderer.invoke('memo:export'),
    import: () => ipcRenderer.invoke('memo:import')
  },
  category: {
    getAll: () => ipcRenderer.invoke('category:getAll'),
    create: (category) => ipcRenderer.invoke('category:create', category),
    update: (id, updates) => ipcRenderer.invoke('category:update', id, updates),
    delete: (id) => ipcRenderer.invoke('category:delete', id)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    getAutoStartStatus: () => ipcRenderer.invoke('settings:getAutoStartStatus'),
    setAutoStart: (enable, silent) => ipcRenderer.invoke('settings:setAutoStart', enable, silent),
    refreshShortcuts: () => ipcRenderer.invoke('settings:refreshShortcuts')
  },
  window: {
    setOpacity: (opacity) => ipcRenderer.invoke('window:setOpacity', opacity),
    setAlwaysOnTop: (onTop) => ipcRenderer.invoke('window:setAlwaysOnTop', onTop),
    resetPosition: () => ipcRenderer.invoke('window:resetPosition'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    setBounds: (bounds) => ipcRenderer.invoke('window:setBounds', bounds),
    setDisplayMode: (mode) => ipcRenderer.invoke('window:setDisplayMode', mode)
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback as (...args: unknown[]) => void)
  },
  // 监听贴边隐藏状态变化
  onEdgeHideChanged: (callback: (data: { isAutoHidden: boolean; edge: string | null; stripSize: number }) => void) => {
    ipcRenderer.on('edge-hide-changed', (_, data) => callback(data))
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
