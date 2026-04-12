import { AnimatePresence, motion } from 'framer-motion'
import { useMemoStore } from '../store/useMemoStore'
import MemoItem from './MemoItem'

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

export default function MemoList() {
  const { memos, categories, activeCategory } = useMemoStore()

  // 过滤备忘录
  const filteredMemos = memos.filter(memo => {
    if (activeCategory === 'all') return !memo.completed
    if (activeCategory === 'done') return memo.completed
    return memo.categoryId === activeCategory && !memo.completed
  })

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[0]
  }

  if (filteredMemos.length === 0) {
    return (
      <div className="memo-list">
        <div className="memo-empty">
          <div className="memo-empty-icon">
            {activeCategory === 'done' ? '✅' : '📝'}
          </div>
          <div className="memo-empty-text">
            {activeCategory === 'all'
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
    <motion.div
      className="memo-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {filteredMemos.map(memo => (
          <MemoItem
            key={memo.id}
            memo={memo}
            category={getCategoryInfo(memo.categoryId)}
            variants={itemVariants}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
