import { motion } from 'framer-motion'
import { useMemoStore } from '../store/useMemoStore'
import { Check } from 'lucide-react'

interface MiniMemoListProps {
  maxCount: number
}

export default function MiniMemoList({ maxCount }: MiniMemoListProps) {
  const { memos, activeCategory, completeMemo } = useMemoStore()

  // 过滤未完成的备忘录
  const filteredMemos = memos.filter(memo => {
    if (activeCategory === 'all') return !memo.completed
    if (activeCategory === 'done') return memo.completed
    return memo.categoryId === activeCategory && !memo.completed
  })

  if (filteredMemos.length === 0) {
    return (
      <div className="mini-empty">
        <span>暂无待办</span>
      </div>
    )
  }

  return (
    <div className="mini-list">
      {filteredMemos.slice(0, maxCount).map(memo => (
        <motion.div
          key={memo.id}
          className="mini-item"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className="mini-check"
            onClick={() => completeMemo(memo.id)}
            title="完成"
          >
            <Check size={10} />
          </button>
          <span className="mini-title" title={memo.title}>{memo.title}</span>
        </motion.div>
      ))}
    </div>
  )
}
