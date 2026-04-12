use crate::storage::store::{AppStore, Memo, MemoUpdate};
use crate::scheduler::reminder::ReminderScheduler;
use tauri::State;
use std::sync::Arc;

#[tauri::command]
pub fn get_memos(store: State<'_, Arc<AppStore>>) -> Vec<Memo> {
    store.get_memos()
}

#[tauri::command]
pub fn create_memo(
    store: State<'_, Arc<AppStore>>,
    scheduler: State<'_, Arc<ReminderScheduler>>,
    memo: Memo,
) -> Result<Memo, String> {
    tracing::info!("Creating memo: {}", memo.title);
    store.add_memo(memo.clone());

    // Schedule reminder if present and not completed
    if memo.reminder_at.is_some() && !memo.completed {
        let scheduler = scheduler.inner().clone();
        let memo_clone = memo.clone();
        tokio::spawn(async move {
            scheduler.schedule_reminder(memo_clone).await;
        });
    }

    Ok(memo)
}

#[tauri::command]
pub fn update_memo(
    store: State<'_, Arc<AppStore>>,
    scheduler: State<'_, Arc<ReminderScheduler>>,
    id: String,
    updates: MemoUpdate,
) -> Result<Option<Memo>, String> {
    tracing::info!("Updating memo: {}", id);
    let updated = store.update_memo(&id, updates.clone());

    if let Some(ref memo) = updated {
        let scheduler = scheduler.inner().clone();
        let memo_clone = memo.clone();
        tokio::spawn(async move {
            if updates.reminder_at.is_some() || updates.completed.is_some() {
                if memo_clone.reminder_at.is_some() && !memo_clone.completed {
                    scheduler.schedule_reminder(memo_clone).await;
                } else {
                    scheduler.cancel_reminder(&memo_clone.id).await;
                }
            }
        });
    }

    Ok(updated)
}

#[tauri::command]
pub fn delete_memo(
    store: State<'_, Arc<AppStore>>,
    scheduler: State<'_, Arc<ReminderScheduler>>,
    id: String,
) -> Result<(), String> {
    tracing::info!("Deleting memo: {}", id);

    // Cancel reminder first
    let scheduler = scheduler.inner().clone();
    let id_clone = id.clone();
    tokio::spawn(async move {
        scheduler.cancel_reminder(&id_clone).await;
    });

    store.delete_memo(&id);
    Ok(())
}

#[tauri::command]
pub fn complete_memo(
    store: State<'_, Arc<AppStore>>,
    scheduler: State<'_, Arc<ReminderScheduler>>,
    id: String,
) -> Result<Option<Memo>, String> {
    tracing::info!("Completing memo: {}", id);

    // Cancel any pending reminder
    let scheduler = scheduler.inner().clone();
    let id_clone = id.clone();
    tokio::spawn(async move {
        scheduler.cancel_reminder(&id_clone).await;
    });

    let updates = MemoUpdate {
        completed: Some(true),
        completed_at: Some(chrono::Utc::now().timestamp_millis() as u64),
        ..Default::default()
    };

    Ok(store.update_memo(&id, updates))
}
