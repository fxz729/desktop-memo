import { useEffect } from 'react'
import { useMemoStore } from './store/useMemoStore'
import MemoWidget from './components/MemoWidget'
import AddMemoModal from './components/AddMemoModal'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  const { loadAll, isAddModalOpen, isSettingsOpen, openAddModal, settings } = useMemoStore()

  useEffect(() => {
    loadAll().then(() => {
      // 应用保存的主题
      const theme = useMemoStore.getState().settings.theme
      if (theme) {
        document.documentElement.setAttribute('data-theme', theme)
      }
    })

    // 监听主进程提醒触发
    const handleReminderTriggered = (memoId: string) => {
      console.log('Reminder triggered for:', memoId)
    }

    window.electronAPI.on('memo:reminder-triggered', handleReminderTriggered as (...args: unknown[]) => void)

    // 监听贴边隐藏状态变化
    const handleEdgeHideChanged = (data: { isAutoHidden: boolean; edge: string | null; stripSize: number }) => {
      if (data.isAutoHidden) {
        document.body.setAttribute('data-edge-hide', data.edge || '')
        document.body.style.setProperty('--edge-strip-size', `${data.stripSize}px`)
      } else {
        document.body.removeAttribute('data-edge-hide')
        document.body.style.setProperty('--edge-strip-size', '0px')
      }
    }

    window.electronAPI.onEdgeHideChanged(handleEdgeHideChanged)

    // 监听新建备忘录快捷键
    const handleOpenAddMemo = () => {
      const { openAddModal } = useMemoStore.getState()
      openAddModal()
    }

    window.electronAPI.on('open-add-memo', handleOpenAddMemo as (...args: unknown[]) => void)

    // 本地快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - 新建备忘录
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        openAddModal()
      }
      // Escape - 关闭弹窗
      if (e.key === 'Escape') {
        const { closeAddModal, closeSettings } = useMemoStore.getState()
        if (useMemoStore.getState().isAddModalOpen) closeAddModal()
        if (useMemoStore.getState().isSettingsOpen) closeSettings()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.electronAPI.off('memo:reminder-triggered', handleReminderTriggered as (...args: unknown[]) => void)
      window.electronAPI.off('open-add-memo', handleOpenAddMemo as (...args: unknown[]) => void)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      <MemoWidget />
      {isAddModalOpen && <AddMemoModal />}
      {isSettingsOpen && <SettingsPanel />}
    </>
  )
}
