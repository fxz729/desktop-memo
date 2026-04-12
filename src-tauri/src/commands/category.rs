use crate::storage::store::{AppStore, Category};
use tauri::State;
use std::sync::Arc;

#[tauri::command]
pub fn get_categories(store: State<'_, Arc<AppStore>>) -> Vec<Category> {
    store.get_categories()
}

#[tauri::command]
pub fn create_category(
    store: State<'_, Arc<AppStore>>,
    category: Category,
) -> Result<Category, String> {
    tracing::info!("Creating category: {}", category.name);
    store.add_category(category.clone());
    Ok(category)
}

#[tauri::command]
pub fn delete_category(
    store: State<'_, Arc<AppStore>>,
    id: String,
) -> Result<(), String> {
    tracing::info!("Deleting category: {}", id);
    store.delete_category(&id);
    Ok(())
}
