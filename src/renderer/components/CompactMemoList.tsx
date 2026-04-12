import { motion } from 'framer-motion'
import { useMemoStore } from '../store/useMemoStore'
import { Check, MapPin, Clock } from 'lucide-react'

export default function CompactMemoList() {
  const { memos, activeCategory, completeMemo } = useMemoStore()

  // 过滤未完成的备忘录
  const filteredMemos = memos.filter(memo => {
    if (activeCategory === 'all') return !memo.completed
    if (activeCategory === 'done') return memo.completed
    return memo.categoryId === activeCategory && !memo.completed
  })

  const formatTime = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now()

    if (diff <= 0) return '已到时'

    const totalMinutes = Math.ceil(diff / (1000 * 60))

    if (totalMinutes >= 24 * 60) {
      return `${Math.floor(totalMinutes / (24 * 60))}天后`
    } else if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      return mins > 0 ? `${hours}小时${mins}分钟后` : `${hours}小时后`
    } else {
      return `${totalMinutes}分钟后`
    }
  }

  if (filteredMemos.length === 0) {
    return (
      <div className="compact-empty">
        <span>暂无待办</span>
      </div>
    )
  }

  return (
    <div className="compact-list">
      {filteredMemos.slice(0, 5).map(memo => (
        <motion.div
          key={memo.id}
          className="compact-item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
        >
          <button
            className="compact-check"
            onClick={() => completeMemo(memo.id)}
          >
            <Check size={12} />
          </button>
          <div className="compact-content">
            <div className="compact-title">{memo.title}</div>
            <div className="compact-meta">
              {memo.reminderAt && (
                <span className="compact-tag">
                  <Clock size={10} />
                  {formatTime(memo.reminderAt)}
                </span>
              )}
              {memo.location && (
                <span className="compact-tag">
                  <MapPin size={10} />
                  {memo.location}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      {filteredMemos.length > 5 && (
        <div className="compact-more">
          还有 {filteredMemos.length - 5} 条...
        </div>
      )}
    </div>
  )
}
