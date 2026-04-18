import { BrowserWindow, screen } from 'electron'
import { join }from 'path'
import { is } from '@electron-toolkit/utils'
import { getSettings, saveSettings } from './storeManager'
import { DisplayMode, DISPLAY_MODE_CONFIGS } from '../shared/types'

let isAutoHidden = false
let originalBounds = { x: 0, y: 0, width: 320, height: 580 }
let hiddenEdge: 'left' | 'right' | 'top' | 'bottom' | null = null
let autoHideTimer: NodeJS.Timeout | null = null
let mouseCheckTimer: NodeJS.Timeout | null = null
let showDelayTimer: NodeJS.Timeout | null = null

const EDGE_THRESHOLD = 5      // 边缘检测阈值（像素）
const SHOW_DELAY = 80          // 显示延迟（毫秒）
const DETECT_RANGE = 30        // 鼠标接近边条多少像素时触发显示
const AUTO_HIDE_DELAY = 800    // 展开后无操作自动隐藏的延迟（毫秒）

// 性能优化：动态轮询间隔
const HIDDEN_POLL_INTERVAL = 100   // 隐藏状态：~10fps，降低CPU占用
const VISIBLE_POLL_INTERVAL = 33   // 显示状态：~30fps，保持响应性

export function setupWindowManager(): BrowserWindow {
  const settings = getSettings()

  // 默认屏幕右下角位置
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const defaultBounds = {
    x: screenWidth - 340,
    y: screenHeight - 620,
    width: 320,
    height: 580
  }

  const bounds = settings.windowBounds || defaultBounds
  originalBounds = { ...bounds }

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: false,  // 关闭透明以让 Mica 背景正常显示
    skipTaskbar: true,  // 跳过任务栏，窗口只通过托盘操作
    alwaysOnTop: settings.alwaysOnTop ?? false,
    resizable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 启用 Mica 毛玻璃效果（Win11）
  win.setBackgroundMaterial('mica')

  // 设置不透明度
  if (settings.opacity !== undefined) {
    win.setOpacity(settings.opacity)
  }

  win.on('ready-to-show', () => {
    const isHidden = process.argv.includes('--hidden')
    if (!isHidden) {
      win.show()
    }
    // 启动鼠标检测
    startMouseChecker(win)
  })

  // 优化：动态轮询间隔 - 隐藏状态低频，显示状态正常
  function startMouseChecker(window: BrowserWindow): void {
    let mouseWasInWindow = false

    // 清除之前的定时器（如果存在）
    if (mouseCheckTimer) {
      clearInterval(mouseCheckTimer)
      mouseCheckTimer = null
    }

    // 动态调整轮询间隔的函数
    function startPollingWithInterval(interval: number): void {
      if (mouseCheckTimer) {
        clearInterval(mouseCheckTimer)
      }

      mouseCheckTimer = setInterval(() => {
        // 检查窗口是否已销毁
        if (window.isDestroyed()) {
          if (mouseCheckTimer) {
            clearInterval(mouseCheckTimer)
            mouseCheckTimer = null
          }
          return
        }

        const mouse = screen.getCursorScreenPoint()
        const bounds = window.getBounds()

        // 判断鼠标是否在窗口范围内
        const mouseInWindow = (
          mouse.x >= bounds.x && mouse.x < bounds.x + bounds.width &&
          mouse.y >= bounds.y && mouse.y < bounds.y + bounds.height
        )

        if (isAutoHidden && hiddenEdge) {
          // 隐藏状态：检测鼠标是否接近边条
          // 获取当前模式的窄条配置
          const settings = getSettings()
          const mode = settings.displayMode || 'standard'
          const config = DISPLAY_MODE_CONFIGS[mode]
          const currentStripSize = hiddenEdge === 'left' || hiddenEdge === 'right'
            ? config.stripWidth
            : config.stripHeight

          let shouldShow = false

          switch (hiddenEdge) {
            case 'left':
              shouldShow = mouse.x >= originalBounds.x - DETECT_RANGE &&
                           mouse.x < originalBounds.x + currentStripSize + DETECT_RANGE
              break
            case 'right':
              shouldShow = mouse.x >= originalBounds.x + originalBounds.width - currentStripSize - DETECT_RANGE &&
                           mouse.x < originalBounds.x + originalBounds.width - currentStripSize + DETECT_RANGE
              break
            case 'top':
              shouldShow = mouse.y >= originalBounds.y - DETECT_RANGE &&
                           mouse.y < originalBounds.y + currentStripSize + DETECT_RANGE
              break
            case 'bottom':
              shouldShow = mouse.y >= originalBounds.y + originalBounds.height - currentStripSize - DETECT_RANGE &&
                           mouse.y < originalBounds.y + originalBounds.height - currentStripSize + DETECT_RANGE
              break
          }

          if (shouldShow) {
            showFromEdge(window)
            // 切换到显示状态的高频轮询
            startPollingWithInterval(VISIBLE_POLL_INTERVAL)
          }
        } else if (!isAutoHidden && window.isVisible()) {
          // 显示状态：检测是否需要自动隐藏
          if (mouseInWindow) {
            // 鼠标在窗口内，取消自动隐藏
            mouseWasInWindow = true
            if (autoHideTimer) {
              clearTimeout(autoHideTimer)
              autoHideTimer = null
            }
          } else {
            // 鼠标不在窗口内
            if (mouseWasInWindow) {
              // 鼠标刚离开窗口，启动自动隐藏定时器
              mouseWasInWindow = false
              if (autoHideTimer) clearTimeout(autoHideTimer)
              const settings = getSettings()
              const hideDelay = settings.edgeHideSettings?.hideDelay ?? AUTO_HIDE_DELAY
              autoHideTimer = setTimeout(() => {
                if (window.isDestroyed()) return
                if (window.isVisible() && !isAutoHidden) {
                  // 检查窗口是否贴边
                  const [wx, wy] = window.getPosition()
                  const [ww, wh] = window.getSize()
                  const display = screen.getDisplayNearestPoint({ x: wx, y: wy })
                  const { width: sw, height: sh, x: sx, y: sy } = display.workArea

                  const settingsInner = getSettings()
                  const threshold = settingsInner.edgeHideSettings?.threshold ?? EDGE_THRESHOLD
                  let edge: 'left' | 'right' | 'top' | 'bottom' | null = null

                  if (wx <= sx + threshold) edge = 'left'
                  else if (wy <= sy + threshold) edge = 'top'
                  else if (wx + ww >= sx + sw - threshold) edge = 'right'
                  else if (wy + wh >= sy + sh - threshold) edge = 'bottom'

                  if (edge) {
                    // 检查该方向是否启用
                    const directions = settingsInner.edgeHideSettings?.directions ?? ['left', 'right', 'top', 'bottom']
                    if (directions.includes(edge)) {
                      hideToEdge(window, edge)
                      // 切换到隐藏状态的低频轮询
                      startPollingWithInterval(HIDDEN_POLL_INTERVAL)
                    }
                  }
                }
              }, hideDelay)
            }
          }
        }
      }, interval)
    }

    // 初始启动为正常频率
    startPollingWithInterval(VISIBLE_POLL_INTERVAL)
  }

  function hideToEdge(window: BrowserWindow, edge: 'left' | 'right' | 'top' | 'bottom'): void {
    if (window.isDestroyed()) return

    const bounds = window.getBounds()
    const { x, y, width, height } = bounds
    originalBounds = { x, y, width, height }
    hiddenEdge = edge

    // 获取当前模式的窄条配置
    const settings = getSettings()
    const mode = settings.displayMode || 'standard'
    const config = DISPLAY_MODE_CONFIGS[mode]
    const stripSize = edge === 'left' || edge === 'right' ? config.stripWidth : config.stripHeight

    let newBounds = { x, y, width, height }

    // 收缩到边缘，根据模式保留对应的窄条尺寸
    switch (edge) {
      case 'left':
        newBounds = { x: x, y, width: stripSize, height }
        break
      case 'right':
        newBounds = { x: x + width - stripSize, y, width: stripSize, height }
        break
      case 'top':
        newBounds = { x, y: y, width, height: stripSize }
        break
      case 'bottom':
        newBounds = { x, y: y + height - stripSize, width, height: stripSize }
        break
    }

    if (!window.isDestroyed()) {
      window.setBounds(newBounds, true) // animated
      isAutoHidden = true
      // 通知渲染进程进入贴边隐藏状态
      window.webContents.send('edge-hide-changed', { isAutoHidden: true, edge: hiddenEdge, stripSize })
    }
  }

  function showFromEdge(window: BrowserWindow): void {
    if (!isAutoHidden) return
    if (window.isDestroyed()) return
    window.setBounds(originalBounds, true) // animated
    isAutoHidden = false
    hiddenEdge = null
    // 通知渲染进程退出贴边隐藏状态
    window.webContents.send('edge-hide-changed', { isAutoHidden: false, edge: null, stripSize: 0 })
    // 清除之前的 showDelayTimer
    if (showDelayTimer) {
      clearTimeout(showDelayTimer)
    }
    showDelayTimer = setTimeout(() => {
      showDelayTimer = null
      if (!window.isDestroyed()) {
        window.focus()
      }
    }, SHOW_DELAY)
  }

  // 窗口移动/位置变化 - 处理贴边隐藏和位置保存
  win.on('moved', () => {
    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()

    // 保存位置
    const currentSettings = getSettings()
    saveSettings({ ...currentSettings, windowBounds: { x, y, width, height } })

    // 贴边隐藏逻辑
    if (isAutoHidden) return
    if (!currentSettings.edgeHide) return

    const display = screen.getDisplayNearestPoint({ x, y })
    const { width: sw, height: sh, x: sx, y: sy } = display.workArea

    // 使用配置的阈值
    const threshold = currentSettings.edgeHideSettings?.threshold ?? EDGE_THRESHOLD
    const directions = currentSettings.edgeHideSettings?.directions ?? ['left', 'right', 'top', 'bottom']

    // 检测贴边方向
    let edge: 'left' | 'right' | 'top' | 'bottom' | null = null

    if (x <= sx + threshold && directions.includes('left')) edge = 'left'
    else if (y <= sy + threshold && directions.includes('top')) edge = 'top'
    else if (x + width >= sx + sw - threshold && directions.includes('right')) edge = 'right'
    else if (y + height >= sy + sh - threshold && directions.includes('bottom')) edge = 'bottom'

    if (edge) {
      hideToEdge(win, edge)
    }
  })

  win.on('resized', () => {
    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()
    const currentSettings = getSettings()
    saveSettings({ ...currentSettings, windowBounds: { x, y, width, height } })
  })

  // 窗口关闭时清理定时器
  win.on('closed', () => {
    if (mouseCheckTimer) {
      clearInterval(mouseCheckTimer)
      mouseCheckTimer = null
    }
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      autoHideTimer = null
    }
    if (showDelayTimer) {
      clearTimeout(showDelayTimer)
      showDelayTimer = null
    }
  })

  // 加载页面
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

export function setWindowOpacity(win: BrowserWindow, opacity: number): void {
  win.setOpacity(Math.max(0.3, Math.min(1.0, opacity)))
  const currentSettings = getSettings()
  saveSettings({ ...currentSettings, opacity })
}

export function setWindowAlwaysOnTop(win: BrowserWindow, onTop: boolean): void {
  win.setAlwaysOnTop(onTop)
  const currentSettings = getSettings()
  saveSettings({ ...currentSettings, alwaysOnTop: onTop })
}

export function setWindowBounds(
  win: BrowserWindow,
  bounds: { width: number; height: number; x?: number; y?: number }
): void {
  const [currentX, currentY] = win.getPosition()
  const newBounds = {
    x: bounds.x ?? currentX,
    y: bounds.y ?? currentY,
    width: bounds.width,
    height: bounds.height
  }
  win.setBounds(newBounds, true) // animated
  // 更新 originalBounds（用于贴边隐藏恢复）
  originalBounds = { ...newBounds }
}

export function setDisplayMode(win: BrowserWindow, mode: DisplayMode): void {
  const config = DISPLAY_MODE_CONFIGS[mode]
  if (!config) return

  const [currentX, currentY] = win.getPosition()
  const newBounds = {
    x: currentX,
    y: currentY,
    width: config.windowBounds.width,
    height: config.windowBounds.height
  }
  win.setBounds(newBounds, true) // animated
  originalBounds = { ...newBounds, x: currentX, y: currentY }
}

export function resetWindowPosition(win: BrowserWindow): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const settings = getSettings()
  const mode = settings.displayMode || 'standard'
  const defaultBounds = DISPLAY_MODE_CONFIGS[mode].windowBounds

  const newBounds = {
    x: screenWidth - defaultBounds.width - 20,
    y: screenHeight - defaultBounds.height - 20,
    width: defaultBounds.width,
    height: defaultBounds.height
  }
  win.setBounds(newBounds)
  // 重置隐藏状态
  isAutoHidden = false
  hiddenEdge = null
  originalBounds = newBounds
}
