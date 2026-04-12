import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'

let tray: Tray | null = null

export async function setupTray(mainWindow: BrowserWindow, onQuit: () => void): Promise<void> {
  // 从 exe 文件提取图标，与任务栏/桌面图标保持完全一致
  const exePath = app.getPath('exe')
  let icon = await app.getFileIcon(exePath, { size: 'small' })

  // 开发模式下 exe 可能取不到有效图标，降级用纯色方块
  if (icon.isEmpty()) {
    const size = 16
    const buf = Buffer.alloc(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        buf[i + 0] = 76; buf[i + 1] = 175; buf[i + 2] = 130; buf[i + 3] = 255
      }
    }
    icon = nativeImage.createFromBuffer(buf, { width: size, height: size })
  }

  tray = new Tray(icon)
  tray.setToolTip('桌面备忘录')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示备忘录',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: '隐藏备忘录',
      click: () => {
        mainWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        onQuit()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
