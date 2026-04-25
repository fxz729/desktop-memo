import { ipcMain, app, BrowserWindow, globalShortcut } from 'electron'
import {
  getMemos, saveMemos, addMemo, updateMemo, deleteMemo,
  getCategories, saveCategories, addCategory, updateCategory, deleteCategory,
  getSettings, saveSettings
} from './storeManager'
import { setWindowOpacity, setWindowAlwaysOnTop, resetWindowPosition, setWindowBounds, setDisplayMode } from './windowManager'
import { setAutoStart, getAutoStartStatus } from './autoStartManager'
import { ReminderService } from './reminderService'
import { Memo, DisplayMode } from '../shared/types'
import type { Shortcuts } from '../shared/types'

// 刷新全局快捷键
function refreshGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  const settings = getSettings()
  const shortcuts: Shortcuts = settings.shortcuts || { toggleWindow: 'CommandOrControl+Shift+M', newMemo: 'CommandOrControl+N' }

  if (shortcuts.toggleWindow) {
    globalShortcut.register(shortcuts.toggleWindow, () => {
      const windows = BrowserWindow.getAllWindows()
      const mainWindow = windows[0]
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
  }

  if (shortcuts.newMemo) {
    globalShortcut.register(shortcuts.newMemo, () => {
      const windows = BrowserWindow.getAllWindows()
      const mainWindow = windows[0]
      if (mainWindow) {
        if (!mainWindow.isVisible()) {
          mainWindow.show()
        }
        mainWindow.focus()
        // 通知渲染进程打开新建备忘录弹窗
        mainWindow.webContents.send('open-add-memo')
      }
    })
  }
}

let reminderService: ReminderService | null = null

export function registerIpcHandlers(): void {
  // ========== Memos ==========
  ipcMain.handle('memo:getAll', () => getMemos())

  ipcMain.handle('memo:create', (_, memo: Memo) => {
    addMemo(memo)
    if (memo.reminderAt) {
      reminderService?.scheduleReminder(memo)
    }
    return memo
  })

  ipcMain.handle('memo:update', (_, id: string, updates: Partial<Memo>) => {
    const updated = updateMemo(id, updates)
    if (updated && reminderService) {
      if (updates.reminderAt !== undefined || updates.completed !== undefined) {
        if (updated.reminderAt && !updated.completed) {
          reminderService.scheduleReminder(updated)
        } else {
          reminderService.cancelReminder(id)
        }
      }
    }
    return updated
  })

  ipcMain.handle('memo:delete', (_, id: string) => {
    reminderService?.cancelReminder(id)
    deleteMemo(id)
  })

  ipcMain.handle('memo:complete', (_, id: string) => {
    const updated = updateMemo(id, { completed: true, completedAt: Date.now() })
    reminderService?.cancelReminder(id)
    return updated
  })

  // ========== Categories ==========
  ipcMain.handle('category:getAll', () => getCategories())

  ipcMain.handle('category:create', (_, category) => {
    addCategory(category)
    return category
  })

  ipcMain.handle('category:delete', (_, id: string) => {
    deleteCategory(id)
  })

  ipcMain.handle('category:update', (_, id: string, updates: Partial<Category>) => {
    return updateCategory(id, updates)
  })

  // ========== Settings ==========
  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', (_, settings) => {
    saveSettings(settings)
  })

  ipcMain.handle('settings:refreshShortcuts', () => {
    refreshGlobalShortcuts()
  })

  ipcMain.handle('settings:getAutoStartStatus', () => {
    return getAutoStartStatus()
  })

  ipcMain.handle('settings:setAutoStart', (_, enable: boolean, silent?: boolean) => {
    const result = setAutoStart(enable, silent)
    if (result.success) {
      const currentSettings = getSettings()
      saveSettings({ ...currentSettings, autoStart: enable, silentStartup: silent ?? currentSettings.silentStartup })
    }
    return result
  })

  // ========== 导入/导出 ==========
  ipcMain.handle('memo:export', async () => {
    try {
      const { dialog } = await import('electron')
      const memos = getMemos()
      const categories = getCategories()
      const settings = getSettings()

      const result = await dialog.showSaveDialog({
        title: '导出备忘录',
        defaultPath: `memo-backup-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      const fs = await import('fs')
      const data = JSON.stringify({ memos, categories, settings, exportedAt: Date.now() }, null, 2)
      await fs.promises.writeFile(result.filePath, data, 'utf-8')

      return { success: true, path: result.filePath }
    } catch (error) {
      console.error('Failed to export memos:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('memo:import', async () => {
    try {
      const { dialog } = await import('electron')
      const result = await dialog.showOpenDialog({
        title: '导入备忘录',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      const fs = await import('fs')
      const data = await fs.promises.readFile(result.filePaths[0], 'utf-8')
      const parsed = JSON.parse(data)

      // 验证数据格式
      if (!parsed.memos || !Array.isArray(parsed.memos)) {
        return { success: false, error: 'Invalid backup file format' }
      }

      // 合并分类（避免重复）
      const existingCategories = getCategories()
      const existingNames = existingCategories.map(c => c.name)
      const newCategories = (parsed.categories || []).filter((c: Category) => !existingNames.includes(c.name))

      for (const cat of newCategories) {
        addCategory(cat)
      }

      // 合并备忘录（避免ID重复）
      const existingMemoIds = getMemos().map(m => m.id)
      const newMemos = parsed.memos.filter((m: Memo) => !existingMemoIds.includes(m.id))

      for (const memo of newMemos) {
        addMemo(memo)
      }

      return {
        success: true,
        imported: {
          memos: newMemos.length,
          categories: newCategories.length
        }
      }
    } catch (error) {
      console.error('Failed to import memos:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // ========== Window Controls ==========
  ipcMain.handle('window:setOpacity', (event, opacity: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) setWindowOpacity(win, opacity)
  })

  ipcMain.handle('window:setAlwaysOnTop', (event, onTop: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) setWindowAlwaysOnTop(win, onTop)
  })

  ipcMain.handle('window:resetPosition', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) resetWindowPosition(win)
  })

  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.hide()
  })

  ipcMain.handle('window:setBounds', (event, bounds: { width: number; height: number; x?: number; y?: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) setWindowBounds(win, bounds)
  })

  ipcMain.handle('window:setDisplayMode', (event, mode: DisplayMode) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      setDisplayMode(win, mode)
      // 保存到设置
      const currentSettings = getSettings()
      saveSettings({ ...currentSettings, displayMode: mode })
    }
  })
}

export function setReminderService(service: ReminderService): void {
  reminderService = service
}
