import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Keyboard, Check, Download, Upload, Plus, Pencil, Trash2 } from 'lucide-react'
import { useMemoStore } from '../store/useMemoStore'
import { ThemeName, DisplayMode, DISPLAY_MODE_CONFIGS, Category, EdgeHideSettings } from '../../shared/types'

// 分类颜色选项
const CATEGORY_COLORS = [
  { id: 'blue', name: '蓝色', value: '#7BA3C9' },
  { id: 'green', name: '绿色', value: '#8FBC8F' },
  { id: 'amber', name: '金色', value: '#E6C87A' },
  { id: 'purple', name: '紫色', value: '#B8A9C9' },
  { id: 'pink', name: '粉色', value: '#E8A8B8' },
  { id: 'teal', name: '青色', value: '#7FCDCD' }
]

// 分类图标选项
const CATEGORY_ICONS = ['💼', '🛒', '🏃', '📚', '🎯', '💡', '🎨', '🎮', '🍜', '✈️', '🏠', '💪']

const THEMES = [
  { id: 'jade' as ThemeName, name: '翡翠绿', color: '#10B981' },
  { id: 'aurora' as ThemeName, name: '极光蓝', color: '#0EA5E9' },
  { id: 'twilight' as ThemeName, name: '暮光紫', color: '#A855F7' },
  { id: 'rose' as ThemeName, name: '玫瑰粉', color: '#F43F5E' },
  { id: 'midnight' as ThemeName, name: '深夜黑', color: '#0F172A' }
]

// 快捷键录制组件 - 增强动画效果
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
      <motion.div
        className="shortcut-recorder recording"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        tabIndex={0}
        style={{ outline: 'none' }}
        animate={{
          scale: [1, 1.02, 1],
          borderColor: ['var(--accent)', 'var(--accent-hover)', 'var(--accent)']
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          按下快捷键...
        </motion.span>
        {keys.length > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginLeft: '8px', fontWeight: 600 }}
          >
            {keys.join(' + ')}
          </motion.span>
        )}
      </motion.div>
    )
  }

  return (
    <motion.button
      className="shortcut-recorder"
      onClick={() => setRecording(true)}
      whileHover={{ scale: 1.02, borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.98 }}
    >
      {formatShortcut(value)}
    </motion.button>
  )
}

export default function SettingsPanel() {
  const { settings, closeSettings, updateSettings, categories, addCategory, updateCategory, deleteCategory } = useMemoStore()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('blue')
  const [newCategoryIcon, setNewCategoryIcon] = useState('💼')
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  // 打开设置面板时验证 OS 实际自启状态
  useEffect(() => {
    ;(async () => {
      try {
        const osStatus = await window.electronAPI.settings.getAutoStartStatus()
        if (settings.autoStart !== osStatus) {
          console.log('[Settings] OS auto-start status mismatch, syncing:', osStatus)
          await updateSettings({ autoStart: osStatus })
        }
      } catch (err) {
        console.error('[Settings] Failed to verify auto-start status:', err)
      }
    })()
  }, [])

  // 新增分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    await addCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: newCategoryIcon
    })
    setNewCategoryName('')
    setNewCategoryColor('blue')
    setNewCategoryIcon('💼')
    setShowCategoryForm(false)
  }

  // 保存分类编辑
  const handleSaveCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return
    await updateCategory(editingCategory.id, {
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: newCategoryIcon
    })
    setEditingCategory(null)
    setNewCategoryName('')
    setShowCategoryForm(false)
  }

  // 开始编辑分类
  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setNewCategoryName(cat.name)
    setNewCategoryColor(cat.color)
    setNewCategoryIcon(cat.icon)
    setShowCategoryForm(true)
  }

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？该分类下的备忘录不会被删除。')) return
    await deleteCategory(id)
  }

  // 取消编辑
  const handleCancelCategory = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryColor('blue')
    setNewCategoryIcon('💼')
    setShowCategoryForm(false)
  }

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
    const result = await window.electronAPI.settings.setAutoStart(checked, checked ? settings.silentStartup : false)
    if (result.success) {
      await updateSettings({ autoStart: checked })
    } else {
      alert(`设置开机自启失败：${result.error || '未知错误'}`)
    }
  }

  const handleSilentStartupChange = async (checked: boolean) => {
    await updateSettings({ silentStartup: checked })
    // 如果开机自启已开启，立即更新 OS 注册
    if (settings.autoStart) {
      const result = await window.electronAPI.settings.setAutoStart(true, checked)
      if (!result.success) {
        alert(`设置静默启动失败：${result.error || '未知错误'}`)
      }
    }
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
    await updateSettings({ theme, darkMode: theme === 'midnight' })
    document.documentElement.setAttribute('data-theme', theme)
  }

  const handleExport = async () => {
    const result = await window.electronAPI.memo.export()
    if (result.success) {
      alert(`导出成功！保存位置：${result.path}`)
    } else if (!result.canceled) {
      alert(`导出失败：${result.error}`)
    }
  }

  const handleImport = async () => {
    if (!confirm('导入会合并现有数据，不会覆盖现有备忘录。确定继续？')) return
    const result = await window.electronAPI.memo.import()
    if (result.success) {
      alert(`导入成功！新增 ${result.imported?.memos} 条备忘录，${result.imported?.categories} 个分类`)
      window.location.reload()
    } else if (!result.canceled) {
      alert(`导入失败：${result.error}`)
    }
  }

  const handlePinToggle = async (memoId: string, currentPinned: boolean) => {
    await window.electronAPI.memo.update(memoId, { pinned: !currentPinned })
    await useMemoStore.getState().loadAll()
  }

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 199
        }}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="settings-panel animate-slide-in"
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
                  <motion.button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    title={theme.name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={settings.theme === theme.id ? {
                      scale: [1, 1.15, 1],
                      boxShadow: [`0 0 0 2px ${theme.color}40`, `0 0 0 4px ${theme.color}20`, `0 0 0 2px ${theme.color}40`]
                    } : {}}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: theme.color,
                      border: settings.theme === theme.id
                        ? '3px solid var(--neu-text-primary)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      boxShadow: 'var(--neu-shadow-raised-sm)'
                    }}
                  >
                    {settings.theme === theme.id && (
                      <Check size={16} color="white" />
                    )}
                  </motion.button>
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

              {/* 贴边隐藏详细设置 */}
              {settings.edgeHide && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'var(--neu-bg-dark)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--neu-shadow-inset-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--neu-text-muted)', marginBottom: '8px' }}>贴边方向</div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {(['left', 'right', 'top', 'bottom'] as const).map(dir => {
                      const isActive = settings.edgeHideSettings?.directions?.includes(dir) ?? true
                      const labels: Record<string, string> = { left: '左', right: '右', top: '上', bottom: '下' }
                      return (
                        <button
                          key={dir}
                          onClick={() => {
                            const current = settings.edgeHideSettings?.directions ?? ['left', 'right', 'top', 'bottom']
                            const newDirs = isActive
                              ? current.filter(d => d !== dir)
                              : [...current, dir]
                            if (newDirs.length > 0) {
                              updateSettings({ edgeHideSettings: { ...settings.edgeHideSettings, directions: newDirs } })
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isActive ? 'var(--neu-accent-soft)' : 'var(--neu-bg)',
                            color: isActive ? 'var(--neu-accent)' : 'var(--neu-text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            boxShadow: isActive ? 'var(--neu-shadow-inset-sm)' : 'var(--neu-shadow-raised-sm)'
                          }}
                        >
                          {labels[dir]}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--neu-text-muted)', marginBottom: '6px' }}>
                    灵敏度 {settings.edgeHideSettings?.threshold ?? 5}px
                  </div>
                  <input
                    className="slider"
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={settings.edgeHideSettings?.threshold ?? 5}
                    onChange={e => updateSettings({ edgeHideSettings: { ...settings.edgeHideSettings, threshold: parseInt(e.target.value) } })}
                    style={{ marginBottom: '12px', width: '100%' }}
                  />

                  <div style={{ fontSize: '11px', color: 'var(--neu-text-muted)', marginBottom: '6px' }}>
                    隐藏延迟 {settings.edgeHideSettings?.hideDelay ?? 800}ms
                  </div>
                  <input
                    className="slider"
                    type="range"
                    min="300"
                    max="1500"
                    step="100"
                    value={settings.edgeHideSettings?.hideDelay ?? 800}
                    onChange={e => updateSettings({ edgeHideSettings: { ...settings.edgeHideSettings, hideDelay: parseInt(e.target.value) } })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

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
                        border: 'none',
                        background: settings.displayMode === config.mode
                          ? 'var(--neu-accent-soft)'
                          : 'var(--neu-bg)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: settings.displayMode === config.mode
                          ? 'var(--neu-shadow-inset-sm)'
                          : 'var(--neu-shadow-raised-sm)'
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--neu-text-primary)'
                      }}>
                        {config.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--neu-text-muted)',
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
              {settings.autoStart && (
                <div className="toggle-container" style={{ marginTop: '8px', marginLeft: '24px' }}>
                  <span className="toggle-label" style={{ fontSize: '12px' }}>静默启动（启动时隐藏窗口）</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.silentStartup ?? false}
                      onChange={e => handleSilentStartupChange(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              )}
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

            {/* 分类管理 */}
            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="setting-label" style={{ marginBottom: 0 }}>分类管理</div>
                <motion.button
                  className="title-bar-btn"
                  onClick={() => { setShowCategoryForm(true); setEditingCategory(null); setNewCategoryName(''); setNewCategoryColor('blue'); setNewCategoryIcon('💼') }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ width: '24px', height: '24px' }}
                >
                  <Plus size={12} />
                </motion.button>
              </div>

              {/* 分类列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.filter(c => !c.isDefault).map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: 'var(--neu-bg)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--neu-shadow-raised-sm)'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--neu-text-primary)' }}>{cat.name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <motion.button
                        className="title-bar-btn"
                        onClick={() => handleStartEditCategory(cat)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ width: '22px', height: '22px' }}
                      >
                        <Pencil size={11} />
                      </motion.button>
                      <motion.button
                        className="title-bar-btn delete"
                        onClick={() => handleDeleteCategory(cat.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ width: '22px', height: '22px' }}
                      >
                        <Trash2 size={11} />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 新增/编辑分类表单 */}
              <AnimatePresence>
                {showCategoryForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: '12px', overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '12px',
                      background: 'var(--neu-bg-dark)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--neu-shadow-inset-sm)'
                    }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="分类名称"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        style={{ marginBottom: '10px' }}
                      />
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--neu-text-muted)', marginBottom: '6px' }}>图标</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {CATEGORY_ICONS.map(icon => (
                            <button
                              key={icon}
                              onClick={() => setNewCategoryIcon(icon)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: newCategoryIcon === icon ? '2px solid var(--neu-accent)' : 'none',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--neu-bg)',
                                boxShadow: newCategoryIcon === icon ? 'var(--neu-shadow-raised-sm)' : 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--neu-text-muted)', marginBottom: '6px' }}>颜色</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {CATEGORY_COLORS.map(color => (
                            <button
                              key={color.id}
                              onClick={() => setNewCategoryColor(color.id)}
                              style={{
                                width: '24px',
                                height: '24px',
                                border: newCategoryColor === color.id ? '2px solid var(--neu-text-primary)' : 'none',
                                borderRadius: '50%',
                                background: color.value,
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-cancel" onClick={handleCancelCategory} style={{ flex: 1, padding: '8px' }}>
                          取消
                        </button>
                        <button className="btn btn-primary" onClick={editingCategory ? handleSaveCategory : handleAddCategory} style={{ flex: 1, padding: '8px' }}>
                          {editingCategory ? '保存' : '添加'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 分隔线 */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '20px' }}>
              {/* 数据管理 */}
              <div className="setting-item">
                <div className="setting-label">数据管理</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn-reset" onClick={handleExport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Download size={13} />
                    导出
                  </button>
                  <button className="btn-reset" onClick={handleImport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Upload size={13} />
                    导入
                  </button>
                </div>
              </div>

              {/* 暗色主题 */}
              <div className="setting-item" style={{ marginTop: '16px' }}>
                <div className="setting-label">外观</div>
                <div className="toggle-container" style={{ marginTop: '8px' }}>
                  <span className="toggle-label">深色模式</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.darkMode || false}
                      onChange={e => updateSettings({ darkMode: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="toggle-container" style={{ marginTop: '12px' }}>
                  <span className="toggle-label">通知声音</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.notificationSound ?? true}
                      onChange={e => updateSettings({ notificationSound: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--neu-text-muted)', textAlign: 'center', marginTop: '20px' }}>
                桌面备忘录 v1.0.1
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
