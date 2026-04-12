import { Minus, Settings, X, GripHorizontal } from 'lucide-react'
import { useMemoStore } from '../store/useMemoStore'
import CategoryTabs from './CategoryTabs'
import MemoList from './MemoList'
import CompactMemoList from './CompactMemoList'
import MiniMemoList from './MiniMemoList'
import UltraMiniMemoList from './UltraMiniMemoList'
import { motion } from 'framer-motion'
import { DISPLAY_MODE_CONFIGS } from '../../shared/types'

export default function MemoWidget() {
  const { settings, openSettings, openAddModal } = useMemoStore()
  const config = DISPLAY_MODE_CONFIGS[settings.displayMode]

  return (
    <div className={`widget-root animate-slide-in ${settings.displayMode}`}>
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-title">
          <GripHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
          <span>{config.title}</span>
        </div>
        <div className="title-bar-buttons">
          <motion.button
            className="title-bar-btn"
            onClick={openSettings}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="设置"
          >
            <Settings size={14} />
          </motion.button>
          <motion.button
            className="title-bar-btn"
            onClick={() => window.electronAPI.window.minimize()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="最小化"
          >
            <Minus size={14} />
          </motion.button>
          <motion.button
            className="title-bar-btn close"
            onClick={() => window.electronAPI.window.close()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="关闭"
          >
            <X size={14} />
          </motion.button>
        </div>
      </div>

      {/* Category Tabs */}
      {config.showCategoryTabs && <CategoryTabs />}

      {/* Memo List - 根据模式选择 */}
      {settings.displayMode === 'standard' && <MemoList />}
      {settings.displayMode === 'compact' && <CompactMemoList maxCount={config.maxDisplayCount} />}
      {settings.displayMode === 'mini' && <MiniMemoList maxCount={config.maxDisplayCount} />}
      {settings.displayMode === 'ultra-mini' && <UltraMiniMemoList maxCount={config.maxDisplayCount} />}

      {/* FAB */}
      {config.showAddButton && (
        <motion.button
          className="add-btn"
          onClick={() => openAddModal()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="新增备忘录"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>
      )}
    </div>
  )
}
