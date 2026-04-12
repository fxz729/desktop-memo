use crate::storage::store::{AppStore, AppSettings};
use tauri::State;
use std::sync::Arc;
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
pub fn get_settings(store: State<'_, Arc<AppStore>>) -> AppSettings {
    store.get_settings()
}

#[tauri::command]
pub fn save_settings(
    store: State<'_, Arc<AppStore>>,
    settings: AppSettings,
) -> Result<(), String> {
    tracing::info!("Saving settings");
    store.save_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn set_auto_start(
    app: tauri::AppHandle,
    store: State<'_, Arc<AppStore>>,
    enable: bool,
) -> Result<(), String> {
    tracing::info!("Setting auto start: {}", enable);

    // Update autostart plugin
    if let Some_autostart = app.autolaunch() {
        if enable {
            if let Err(e) = some_autostart.enable() {
                tracing::error!("Failed to enable autostart: {}", e);
                return Err(e.to_string());
            }
        } else {
            if let Err(e) = some_autostart.disable() {
                tracing::error!("Failed to disable autostart: {}", e);
                return Err(e.to_string());
            }
        }
    }

    // Update settings
    let mut settings = store.get_settings();
    settings.auto_start = enable;
    store.save_settings(settings);

    Ok(())
}
