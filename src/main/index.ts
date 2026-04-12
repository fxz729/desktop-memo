import { app, BrowserWindow, shell, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { setupWindowManager } from './windowManager'
import { setupTray } from './trayManager'
import { registerIpcHandlers } from './ipcHandlers'
import { initStore, getSettings } from './storeManager'
import { ReminderService } from './reminderService'
import { setReminderService } from './ipcHandlers'

// 防止多实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let reminderService: ReminderService | null = null
let isQuitting = false

// 注册全局快捷键
function registerGlobalShortcuts(): void {
  // 先注销所有现有快捷键
  globalShortcut.unregisterAll()

  const settings = getSettings()
  const { shortcuts } = settings

  // 显示/隐藏主界面
  if (shortcuts.toggleWindow) {
    globalShortcut.register(shortcuts.toggleWindow, () => {
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
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.desktop.memo')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initStore()
  registerIpcHandlers()

  createWindow()
  await setupTray(mainWindow!, () => { isQuitting = true })
  registerGlobalShortcuts()

  reminderService = new ReminderService(mainWindow!)
  reminderService.loadAllReminders()
  setReminderService(reminderService)

  mainWindow!.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow!.hide()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createWindow(): void {
  mainWindow = setupWindowManager()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.focus()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})

export { mainWindow }
