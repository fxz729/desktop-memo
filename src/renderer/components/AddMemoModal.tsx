import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemoStore } from '../store/useMemoStore'
import { Memo } from '../types'

export default function AddMemoModal() {
  const { categories, editingMemo, closeAddModal, addMemo, updateMemo } = useMemoStore()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'work')
  const [reminderAt, setReminderAt] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingMemo) {
      setTitle(editingMemo.title)
      setCategoryId(editingMemo.categoryId)
      setReminderAt(editingMemo.reminderAt ? editingMemo.reminderAt.slice(0, 16) : '')
      setLocation(editingMemo.location || '')
      setNotes(editingMemo.notes || '')
    }
  }, [editingMemo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const memoData = {
      title: title.trim(),
      categoryId,
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined
    }

    if (editingMemo) {
      await updateMemo(editingMemo.id, memoData)
    } else {
      await addMemo(memoData as Omit<Memo, 'id' | 'createdAt' | 'completed' | 'completedAt'>)
    }

    closeAddModal()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeAddModal()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
        <motion.div
          className="modal animate-slide-in"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94]}}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="modal-title">{editingMemo ? '编辑备忘录' : '新增备忘录'}</h2>
            <button
              onClick={closeAddModal}
              className="memo-action-btn"
              style={{ boxShadow: 'none' }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 标题 */}
            <div className="form-field">
              <label className="form-label">标题 *</label>
              <input
                className="form-input"
                type="text"
                placeholder="要记录的事情..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* 分类 */}
            <div className="form-field">
              <label className="form-label">分类</label>
              <div className="cat-selector">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-option cat-${cat.color} ${categoryId === cat.id ? 'selected' : ''}`}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 时间和地点一行 */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">提醒时间</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={reminderAt}
                  onChange={e => setReminderAt(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div className="form-field">
                <label className="form-label">地点</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="可选"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* 备注 */}
            <div className="form-field">
              <label className="form-label">备注</label>
              <textarea
                className="form-input form-textarea"
                placeholder="可选备注..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* 按钮 */}
            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={closeAddModal}>
                取消
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!title.trim()}
              >
                {editingMemo ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
