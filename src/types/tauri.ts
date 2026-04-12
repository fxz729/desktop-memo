import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Memo, Category, AppSettings } from '../shared/types'

// Tauri API adapter - replaces electron IPC

export const memoApi = {
  getAll: () => invoke<Memo[]>('get_memos'),

  create: (memo: Memo) => invoke<Memo>('create_memo', { memo }),

  update: (id: string, updates: Partial<Memo>) =>
    invoke<Memo | null>('update_memo', { id, updates }),

  delete: (id: string) => invoke<void>('delete_memo', { id }),

  complete: (id: string) => invoke<Memo | null>('complete_memo', { id }),
}

export const categoryApi = {
  getAll: () => invoke<Category[]>('get_categories'),

  create: (category: Category) => invoke<Category>('create_category', { category }),

  delete: (id: string) => invoke<void>('delete_category', { id }),
}

export const settingsApi = {
  get: () => invoke<AppSettings>('get_settings'),

  save: (settings: AppSettings) => invoke<void>('save_settings', { settings }),

  setAutoStart: (enable: boolean) => invoke<void>('set_auto_start', { enable }),
}

export const windowApi = {
  setOpacity: (opacity: number) => invoke<void>('set_opacity', { opacity }),

  setAlwaysOnTop: (onTop: boolean) => invoke<void>('set_always_on_top', { onTop }),

  resetPosition: () => invoke<void>('reset_position'),

  minimize: () => invoke<void>('minimize'),

  close: () => invoke<void>('close'),

  startDragging: () => invoke<void>('start_dragging'),
}

export const events = {
  onReminderTriggered: (callback: (memoId: string) => void) => {
    return listen<string>('memo:reminder-triggered', (event) => {
      callback(event.payload)
    })
  },
}
