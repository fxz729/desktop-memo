import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Keyboard, Check } from 'lucide-react'
import { useMemoStore } from '../store/useMemoStore'
import { ThemeName, DisplayMode, DISPLAY_MODE_CONFIGS } from '../../shared/types'

const THEMES = [
  { id: 'jade' as ThemeName, name: '翡翠绿', color: '#10B981' },
  { id: 'aurora' as ThemeName, name: '极光蓝', color: '#0EA5E9' },
  { id: 'twilight' as ThemeName, name: '暮光紫', color: '#A855F7' },
  { id: 'rose' as ThemeName, name: '玫瑰粉', color: '#F43F5E' },
  { id: 'midnight' as ThemeName, name: '深夜黑', color: '#0F172A' }
]

// 快捷键录制组件
function ShortcutRecorder({ value, onSave }: { value: string; onSave: (key: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [keys, setKeys] = useState<string[]>([])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!recording) return
    e.preventDefault()

    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    if (e.metaKey) parts.push('Meta')

    const key = e.key.toUpperCase()
    if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
      parts.push(key)
    }

    if (parts.length > 0) {
      setKeys(parts)
    }
  }

  const handleKeyUp = () => {
    if (!recording || keys.length === 0) return
    const shortcut = keys.join('+')
    onSave(shortcut)
    setRecording(false)
    setKeys([])
  }

  const formatShortcut = (s: string) => {
    return s.replace('CommandOrControl', 'Ctrl').replace('+', ' + ')
  }

  if (recording) {
    return (
      <div
        className="shortcut-recorder recording"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        按下快捷键... {keys.join(' + ')}
      </div>
    )
  }

  return (
    <button
      className="shortcut-recorder"
      onClick={() => setRecording(true)}
    >
      {formatShortcut(value)}
    </button>
  )
}

export default function SettingsPanel() {
  const { settings, closeSettings, updateSettings } = useMemoStore()

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeSettings()
  }

  const handleOpacityChange = async (value: number) => {
    await updateSettings({ opacity: value })
    await window.electronAPI.window.setOpacity(value)
  }

  const handleAlwaysOnTopChange = async (checked: boolean) => {
    await updateSettings({ alwaysOnTop: checked })
    await window.electronAPI.window.setAlwaysOnTop(checked)
  }

  const handleAutoStartChange = async (checked: boolean) => {
    await updateSettings({ autoStart: checked })
    await window.electronAPI.settings.setAutoStart(checked)
  }

  const handleEdgeHideChange = async (checked: boolean) => {
    await updateSettings({ edgeHide: checked })
  }

  const handleDisplayModeChange = async (mode: DisplayMode) => {
    await updateSettings({ displayMode: mode })
    await window.electronAPI.window.setDisplayMode(mode)
  }

  const handleShortcutChange = async (key: string, value: string) => {
    const newShortcuts = { ...settings.shortcuts, [key]: value }
    await updateSettings({ shortcuts: newShortcuts })
    await window.electronAPI.settings.refreshShortcuts()
  }

  const handleResetPosition = async () => {
    await window.electronAPI.window.resetPosition()
  }

  const handleThemeChange = async (theme: ThemeName) => {
    await updateSettings({ theme })
    document.documentElement.setAttribute('data-theme', theme)
  }

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.2)',
          zIndex: 199
        }}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="settings-panel animate-slide-in"
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="settings-header">
            <h3 className="settings-title">设置</h3>
            <motion.button
              className="title-bar-btn"
              onClick={closeSettings}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={14} />
            </motion.button>
          </div>

          {/* Body */}
          <div className="settings-body">

            {/* 主题选择 */}
            <div className="setting-item">
              <div className="setting-label">主题</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    title={theme.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: theme.color,
                      border: settings.theme === theme.id
                        ? '3px solid var(--text-primary)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {settings.theme === theme.id && (
                      <Check size={16} color="white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 透明度 */}
            <div className="setting-item">
              <div className="setting-label">透明度</div>
              <div className="slider-container">
                <input
                  className="slider"
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={e => handleOpacityChange(parseFloat(e.target.value))}
                />
                <span className="slider-value">{Math.round(settings.opacity * 100)}%</span>
              </div>
            </div>

            {/* 窗口行为 */}
            <div className="setting-item">
              <div className="setting-label">窗口行为</div>
              <div className="toggle-container" style={{ marginTop: '8px' }}>
                <span className="toggle-label">始终置顶</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.alwaysOnTop}
                    onChange={e => handleAlwaysOnTopChange(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="toggle-container" style={{ marginTop: '12px' }}>
                <span className="toggle-label">贴边隐藏</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.edgeHide}
                    onChange={e => handleEdgeHideChange(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* 显示模式 */}
              <div style={{ marginTop: '16px' }}>
                <div className="setting-label" style={{ marginBottom: '10px' }}>显示模式</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.values(DISPLAY_MODE_CONFIGS).map(config => (
                    <button
                      key={config.mode}
                      onClick={() => handleDisplayModeChange(config.mode)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: settings.displayMode === config.mode
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border)',
                        background: settings.displayMode === config.mode
                          ? 'var(--accent-light)'
                          : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)'
                      }}>
                        {config.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '2px'
                      }}>
                        {config.windowBounds.width}x{config.windowBounds.height}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 启动 */}
            <div className="setting-item">
              <div className="setting-label">启动</div>
              <div className="toggle-container" style={{ marginTop: '8px' }}>
                <span className="toggle-label">开机自启</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.autoStart}
                    onChange={e => handleAutoStartChange(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* 快捷键 */}
            <div className="setting-item">
              <div className="setting-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Keyboard size={13} />
                  快捷键
                </span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className="shortcut-item">
                  <span className="shortcut-label">显示/隐藏</span>
                  <ShortcutRecorder
                    value={settings.shortcuts?.toggleWindow || 'Ctrl+Shift+M'}
                    onSave={(v) => handleShortcutChange('toggleWindow', v)}
                  />
                </div>
                <div className="shortcut-item" style={{ marginTop: '8px' }}>
                  <span className="shortcut-label">新建备忘录</span>
                  <ShortcutRecorder
                    value={settings.shortcuts?.newMemo || 'Ctrl+N'}
                    onSave={(v) => handleShortcutChange('newMemo', v)}
                  />
                </div>
              </div>
            </div>

            {/* 位置 */}
            <div className="setting-item">
              <div className="setting-label">位置</div>
              <button className="btn-reset" onClick={handleResetPosition}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <RotateCcw size={13} />
                  重置窗口位置
                </span>
              </button>
            </div>

            {/* 分隔线 */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                桌面备忘录 v1.0.1
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
