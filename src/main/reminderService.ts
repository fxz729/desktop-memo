import schedule from 'node-schedule'
import { BrowserWindow, Notification } from 'electron'
import { getMemos, getSettings } from './storeManager'
import { Memo } from '../shared/types'

export class ReminderService {
  private scheduledJobs: Map<string, schedule.Job> = new Map()
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  loadAllReminders(): void {
    const memos = getMemos()
    const now = Date.now()

    memos.forEach(memo => {
      if (memo.reminderAt && !memo.completed) {
        const reminderTime = new Date(memo.reminderAt).getTime()
        if (reminderTime > now) {
          this.scheduleReminder(memo)
        }
      }
    })
  }

  scheduleReminder(memo: Memo): void {
    if (!memo.reminderAt) return

    // 取消已有的
    this.cancelReminder(memo.id)

    const date = new Date(memo.reminderAt)

    const job = schedule.scheduleJob(date, () => {
      this.triggerReminder(memo)
    })

    if (job) {
      this.scheduledJobs.set(memo.id, job)
    }
  }

  cancelReminder(memoId: string): void {
    const job = this.scheduledJobs.get(memoId)
    if (job) {
      job.cancel()
      this.scheduledJobs.delete(memoId)
    }
  }

  private triggerReminder(memo: Memo): void {
    const notif = new Notification({
      title: '⏰ 备忘录提醒',
      body: memo.title + (memo.location ? `\n📍 ${memo.location}` : ''),
      silent: false
    })

    notif.on('click', () => {
      if (this.mainWindow) {
        this.mainWindow.show()
        this.mainWindow.focus()
        this.mainWindow.webContents.send('memo:reminder-clicked', memo.id)
      }
    })

    notif.show()

    // 同时通知渲染进程更新UI
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('memo:reminder-triggered', memo.id)
    }

    // 从调度中移除
    this.scheduledJobs.delete(memo.id)
  }
}
