use tauri::{Window, Manager};

#[tauri::command]
pub fn set_opacity(window: Window, opacity: f64) -> Result<(), String> {
    window.set_opacity(opacity).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_always_on_top(window: Window, on_top: bool) -> Result<(), String> {
    window.set_always_on_top(on_top).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_position(window: Window) -> Result<(), String> {
    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: 100,
        y: 100,
    })).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn minimize(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn close(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_dragging(window: Window) -> Result<(), String> {
    window.start_drag_move().map_err(|e| e.to_string())
}
