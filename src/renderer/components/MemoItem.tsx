import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Check, Trash2, MapPin, Clock } from 'lucide-react'
import { useMemoStore } from '../store/useMemoStore'
import { Memo, Category } from '../types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  memo: Memo
  category?: Category
  variants?: Variants
}

export default function MemoItem({ memo, category, variants }: Props) {
  const { completeMemo, deleteMemo, openAddModal } = useMemoStore()
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    if (isCompleting || memo.completed) return
    setIsCompleting(true)

    // 动画延迟后再移动到已完成
    setTimeout(async () => {
      await completeMemo(memo.id)
      setIsCompleting(false)
    }, 300)
  }

  const handleDelete = async () => {
    await deleteMemo(memo.id)
  }

  const formatReminder = (isoStr: string) => {
    try {
      return format(new Date(isoStr), 'M月d日 HH:mm', { locale: zhCN })
    } catch {
      return ''
    }
  }

  const catColorClass = category?.color ? `cat-${category.color}` : ''

  return (
    <motion.div
      className={`memo-item ${memo.completed ? 'completed' : ''}`}
      variants={variants}
      layout
    >
      {/* Checkbox */}
      <motion.button
        className={`memo-checkbox ${memo.completed || isCompleting ? 'checked' : ''} ${catColorClass}`}
        onClick={handleComplete}
        whileHover={memo.completed ? {} : { scale: 1.1 }}
        whileTap={memo.completed ? {} : { scale: 0.9 }}
        style={memo.completed ? { background: 'var(--cat, #94A3B8)', borderColor: 'var(--cat, #94A3B8)' } : {}}
      >
        {(memo.completed || isCompleting) && <Check size={11} strokeWidth={3} />}
      </motion.button>

      {/* Body */}
      <div className="memo-body">
        <motion.span
          className="memo-title"
          animate={
            memo.completed || isCompleting
              ? { textDecoration: 'line-through', opacity: 0.45 }
              : { opacity: 1 }
          }
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
              <Clock size={10} />
              {formatReminder(memo.reminderAt)}
            </span>
          )}

          {memo.location && (
            <span className="memo-tag">
              <MapPin size={10} />
              {memo.location}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="memo-actions">
        <motion.button
          className="memo-action-btn"
          onClick={() => openAddModal(memo)}
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
          onClick={handleDelete}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="删除"
        >
          <Trash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  )
}
