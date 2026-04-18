import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, GripVertical, CheckCircle, FileText } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoStore } from '../store/useMemoStore'
import { Memo } from '../../shared/types'

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    x: -120,
    opacity: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] }
  }
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 }
  }
}

// 拖拽激活距离常量
const DRAG_ACTIVATION_DISTANCE = 8

// 可拖拽的 MemoItem 包装组件
function SortableMemoItem({
  memo,
  category,
  variants,
  onEdit,
  onDelete,
  onComplete,
  onPin,
  formatReminder
}: {
  memo: Memo
  category: any
  variants: any
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onPin: () => void
  formatReminder: (isoStr: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: memo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`memo-item ${memo.completed ? 'completed' : ''} ${memo.pinned ? 'pinned' : ''} ${isDragging ? 'dragging' : ''}`}
      variants={variants}
      layout
      {...attributes}
    >
      {/* 拖拽手柄 */}
      <div className="memo-drag-handle" {...listeners}>
        <GripVertical size={14} />
      </div>

      {/* Checkbox */}
      <motion.button
        className={`memo-checkbox ${memo.completed ? 'checked' : ''}`}
        onClick={onComplete}
        whileHover={memo.completed ? {} : { scale: 1.1 }}
        whileTap={memo.completed ? {} : { scale: 0.9 }}
        style={memo.completed ? { background: 'var(--cat, var(--neu-cat-done))', boxShadow: 'var(--neu-shadow-raised-sm)' } : {}}
      >
        {memo.completed && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </motion.button>

      {/* Body */}
      <div className="memo-body">
        <motion.span
          className="memo-title"
          animate={memo.completed ? { textDecoration: 'line-through', opacity: 0.45 } : { opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {memo.title}
        </motion.span>

        {/* Meta tags */}
        <div className="memo-meta">
          {category && (
            <span className={`memo-tag cat-dot cat-${category.color}`}>
              {category.icon} {category.name}
            </span>
          )}

          {memo.reminderAt && (
            <span className="memo-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatReminder(memo.reminderAt)}
            </span>
          )}

          {memo.location && (
            <span className="memo-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {memo.location}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="memo-actions">
        <motion.button
          className={`memo-action-btn ${memo.pinned ? 'pinned' : ''}`}
          onClick={onPin}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={memo.pinned ? '取消置顶' : '置顶'}
          style={memo.pinned ? { color: 'var(--neu-accent)' } : {}}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L12 12" />
            <path d="M18.364 5.636L12 12l-6.364-6.364" />
            <circle cx="12" cy="18" r="4" />
          </svg>
        </motion.button>
        <motion.button
          className="memo-action-btn"
          onClick={onEdit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="编辑"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </motion.button>
        <motion.button
          className="memo-action-btn delete"
          onClick={onDelete}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="删除"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function MemoList() {
  const { memos, categories, activeCategory, completeMemo, deleteMemo, updateMemo, openAddModal, updateMemo: storeUpdateMemo } = useMemoStore()
  const [searchText, setSearchText] = useState('')
  const [localMemos, setLocalMemos] = useState<Memo[]>([])

  // 使用本地状态进行拖拽排序
  const sortedMemos = localMemos.length > 0 ? localMemos : memos

  // 同步 memos 到本地状态（响应式更新）
  useEffect(() => {
    const filtered = memos.filter(memo => {
      if (activeCategory === 'all') return !memo.completed  // 全部：只显示未完成
      if (activeCategory === 'done') return memo.completed   // 已完成：只显示已完成
      return memo.categoryId === activeCategory  // 自定义分类：显示所有（包括已完成）
    })

    const sorted = [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (b.order || 0) - (a.order || 0)
    })
    setLocalMemos(sorted)
  }, [memos, activeCategory])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 过滤备忘录
  const filteredMemos = sortedMemos.filter(memo => {
    // 分类过滤
    if (activeCategory === 'all' && memo.completed) return false
    if (activeCategory === 'done' && !memo.completed) return false
    if (activeCategory !== 'all' && activeCategory !== 'done' && memo.categoryId !== activeCategory) return false

    // 搜索过滤
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      const matchTitle = memo.title.toLowerCase().includes(search)
      const matchNotes = memo.notes?.toLowerCase().includes(search)
      return matchTitle || matchNotes
    }

    return true
  })

  // 置顶备忘录优先排序
  const displayMemos = [...filteredMemos].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.order || 0) - (a.order || 0)
  })

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[0]
  }

  const formatReminder = (isoStr: string) => {
    try {
      const date = new Date(isoStr)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${month}月${day}日 ${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = displayMemos.findIndex(m => m.id === active.id)
      const newIndex = displayMemos.findIndex(m => m.id === over.id)

      const newOrder = arrayMove(displayMemos, oldIndex, newIndex)
      setLocalMemos(newOrder)

      // 持久化排序（带错误处理）
      try {
        const results = await Promise.allSettled(
          newOrder.map((memo, i) => storeUpdateMemo(memo.id, { order: newOrder.length - i }))
        )
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0) {
          console.error(`Failed to persist ${failures.length} memo orders`)
        }
      } catch (error) {
        console.error('Failed to persist memo order:', error)
      }
    }
  }

  if (displayMemos.length === 0) {
    return (
      <div className="memo-list">
        <div className="search-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索备忘录..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="search-clear" onClick={() => setSearchText('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className="memo-empty">
          <div className="memo-empty-icon">
            {activeCategory === 'done'
              ? <CheckCircle size={32} style={{ opacity: 0.4 }} />
              : <FileText size={32} style={{ opacity: 0.4 }} />
            }
          </div>
          <div className="memo-empty-text">
            {searchText
              ? '没有找到匹配的备忘录'
              : activeCategory === 'all'
              ? '还没有备忘录\n点击 + 添加第一条'
              : activeCategory === 'done'
              ? '暂无已完成的备忘录'
              : '该分类下暂无备忘录'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="memo-list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="search-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="搜索备忘录... (可拖拽排序)"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="search-clear" onClick={() => setSearchText('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <SortableContext items={displayMemos.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {displayMemos.map(memo => (
              <SortableMemoItem
                key={memo.id}
                memo={memo}
                category={getCategoryInfo(memo.categoryId)}
                variants={itemVariants}
                onEdit={() => openAddModal(memo)}
                onDelete={() => deleteMemo(memo.id)}
                onComplete={() => completeMemo(memo.id)}
                onPin={() => updateMemo(memo.id, { pinned: !memo.pinned })}
                formatReminder={formatReminder}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </motion.div>
    </DndContext>
  )
}
