import { useMemoStore } from '../store/useMemoStore'
import { Check } from 'lucide-react'

interface UltraMiniMemoListProps {
  maxCount: number
}

export default function UltraMiniMemoList({ maxCount }: UltraMiniMemoListProps) {
  const { memos, activeCategory, completeMemo } = useMemoStore()

  // 过滤未完成的备忘录
  const filteredMemos = memos.filter(memo => {
    if (activeCategory === 'all') return !memo.completed
    if (activeCategory === 'done') return memo.completed
    return memo.categoryId === activeCategory && !memo.completed
  })

  if (filteredMemos.length === 0) {
    return (
      <div className="ultra-mini-empty">
        <span>无</span>
      </div>
    )
  }

  return (
    <div className="ultra-mini-list">
      {filteredMemos.slice(0, maxCount).map(memo => (
        <div
          key={memo.id}
          className="ultra-mini-item"
          onClick={() => completeMemo(memo.id)}
          title={memo.title}
        >
          <Check size={8} className="ultra-mini-check" />
          <span className="ultra-mini-title">{memo.title}</span>
        </div>
      ))}
    </div>
  )
}
