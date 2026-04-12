use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use tauri::{AppHandle, Emitter};
use crate::storage::store::Memo;

pub struct ReminderScheduler {
    tasks: Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>,
    app_handle: AppHandle,
}

impl ReminderScheduler {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    pub async fn schedule_reminder(&self, memo: Memo) {
        let Some(reminder_str) = &memo.reminder_at else {
            return;
        };

        // Parse ISO 8601 timestamp
        let reminder = chrono::DateTime::parse_from_rfc3339(reminder_str)
            .map(|dt| dt.timestamp_millis() as u64)
            .unwrap_or(0);

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        if reminder <= now {
            // Already past, trigger immediately
            self.trigger_reminder(&memo).await;
            return;
        }

        let delay_ms = reminder - now;
        let memo_id = memo.id.clone();
        let app_handle = self.app_handle.clone();
        let tasks = self.tasks.clone();

        // Cancel existing task for this memo
        self.cancel_reminder(&memo_id).await;

        // Schedule new task
        let handle = tokio::spawn(async move {
            sleep(Duration::from_millis(delay_ms)).await;
            if let Err(e) = app_handle.emit("memo:reminder-triggered", &memo_id) {
                tracing::error!("Failed to emit reminder event: {}", e);
            }
            tasks.lock().await.remove(&memo_id);
        });

        self.tasks.lock().await.insert(memo_id, handle);
        tracing::info!("Scheduled reminder for memo {} in {} ms", memo.id, delay_ms);
    }

    pub async fn cancel_reminder(&self, memo_id: &str) {
        if let Some(handle) = self.tasks.lock().await.remove(memo_id) {
            handle.abort();
            tracing::info!("Cancelled reminder for memo {}", memo_id);
        }
    }

    pub async fn load_reminders(&self, memos: &[Memo]) {
        for memo in memos {
            if memo.reminder_at.is_some() && !memo.completed {
                self.schedule_reminder(memo.clone()).await;
            }
        }
    }

    async fn trigger_reminder(&self, memo: &Memo) {
        let app_handle = self.app_handle.clone();
        let memo_id = memo.id.clone();

        // Emit event to frontend
        if let Err(e) = app_handle.emit("memo:reminder-triggered", &memo_id) {
            tracing::error!("Failed to emit reminder event: {}", e);
        }

        // Show system notification
        #[cfg(not(target_os = "macos"))]
        {
            use tauri_plugin_notification::NotificationExt;
            if let Err(e) = app_handle.notification()
                .builder()
                .title("备忘录提醒")
                .body(&memo.title)
                .show()
            {
                tracing::error!("Failed to show notification: {}", e);
            }
        }
    }
}
