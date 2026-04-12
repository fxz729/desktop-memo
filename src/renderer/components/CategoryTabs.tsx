import { motion } from 'framer-motion'
import { useMemoStore } from '../store/useMemoStore'

export default function CategoryTabs() {
  const { categories, memos, activeCategory, setActiveCategory } = useMemoStore()

  const getCount = (catId: string) => {
    if (catId === 'all') return memos.filter(m => !m.completed).length
    if (catId === 'done') return memos.filter(m => m.completed).length
    return memos.filter(m => m.categoryId === catId && !m.completed).length
  }

  const allCategories = [
    { id: 'all', name: '全部', icon: '📋', color: 'default', isDefault: true },
    ...categories,
    { id: 'done', name: '已完成', icon: '✅', color: 'done', isDefault: true }
  ]

  return (
    <div className="category-tabs">
      {allCategories.map(cat => {
        const count = getCount(cat.id)
        const isActive = activeCategory === cat.id
        const colorClass = cat.color === 'default' ? '' : `cat-${cat.color}`

        return (
          <motion.button
            key={cat.id}
            className={`cat-tab ${colorClass} ${isActive ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            {count > 0 && (
              <span style={{
                fontSize: '10px',
                background: isActive ? 'var(--cat-text)' : 'var(--border)',
                color: isActive ? 'white' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '0 5px',
                minWidth: '16px',
                textAlign: 'center',
                lineHeight: '16px'
              }}>
                {count}
              </span>
            )}
          </motion.button>
        )
      })}

      {/* Add Category */}
      <motion.button
        className="cat-tab"
        onClick={() => {
          const name = window.prompt('输入分类名称：')
          if (name) {
            const icon = window.prompt('输入图标（emoji）：', '📌') || '📌'
            useMemoStore.getState().addCategory({ name, icon, color: 'custom', isDefault: false })
          }
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{ color: 'var(--text-muted)' }}
      >
        +
      </motion.button>
    </div>
  )
}
