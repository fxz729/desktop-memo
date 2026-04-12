use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memo {
    pub id: String,
    pub title: String,
    pub category_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reminder_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    pub completed: bool,
    pub created_at: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
    #[serde(default)]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub auto_start: bool,
    pub window_bounds: WindowBounds,
    pub opacity: f64,
    pub always_on_top: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct StoreSchema {
    memos: Vec<Memo>,
    categories: Vec<Category>,
    settings: AppSettings,
}

impl Default for StoreSchema {
    fn default() -> Self {
        Self {
            memos: Vec::new(),
            categories: vec![
                Category {
                    id: "work".to_string(),
                    name: "工作/学习".to_string(),
                    color: "blue".to_string(),
                    icon: "💼".to_string(),
                    is_default: true,
                },
                Category {
                    id: "life".to_string(),
                    name: "生活/购物".to_string(),
                    color: "green".to_string(),
                    icon: "🛒".to_string(),
                    is_default: true,
                },
                Category {
                    id: "health".to_string(),
                    name: "健康/运动".to_string(),
                    color: "amber".to_string(),
                    icon: "🏃".to_string(),
                    is_default: true,
                },
            ],
            settings: AppSettings {
                auto_start: false,
                window_bounds: WindowBounds {
                    x: 0,
                    y: 0,
                    width: 320,
                    height: 580,
                },
                opacity: 0.92,
                always_on_top: false,
            },
        }
    }
}

pub struct AppStore {
    path: PathBuf,
    data: Mutex<StoreSchema>,
}

impl AppStore {
    pub fn new(app_dir: &PathBuf) -> std::io::Result<Self> {
        fs::create_dir_all(app_dir)?;
        let path = app_dir.join("desktop-memo-data.json");

        let data = if path.exists() {
            let content = fs::read_to_string(&path)?;
            serde_json::from_str(&content).unwrap_or_else(|_| StoreSchema::default())
        } else {
            StoreSchema::default()
        };

        Ok(Self {
            path,
            data: Mutex::new(data),
        })
    }

    fn save(&self) -> std::io::Result<()> {
        let data = self.data.lock().unwrap();
        let content = serde_json::to_string_pretty(&*data)?;
        fs::write(&self.path, content)
    }

    // Memo operations
    pub fn get_memos(&self) -> Vec<Memo> {
        self.data.lock().unwrap().memos.clone()
    }

    pub fn add_memo(&self, memo: Memo) {
        let mut data = self.data.lock().unwrap();
        data.memos.push(memo);
        drop(data);
        let _ = self.save();
    }

    pub fn update_memo(&self, id: &str, updates: MemoUpdate) -> Option<Memo> {
        let mut data = self.data.lock().unwrap();
        if let Some(memo) = data.memos.iter_mut().find(|m| m.id == id) {
            if let Some(title) = updates.title {
                memo.title = title;
            }
            if let Some(category_id) = updates.category_id {
                memo.category_id = category_id;
            }
            if let Some(reminder_at) = updates.reminder_at {
                memo.reminder_at = Some(reminder_at);
            }
            if let Some(location) = updates.location {
                memo.location = Some(location);
            }
            if let Some(notes) = updates.notes {
                memo.notes = Some(notes);
            }
            if let Some(completed) = updates.completed {
                memo.completed = completed;
            }
            if let Some(completed_at) = updates.completed_at {
                memo.completed_at = Some(completed_at);
            }
            let result = memo.clone();
            drop(data);
            let _ = self.save();
            return Some(result);
        }
        None
    }

    pub fn delete_memo(&self, id: &str) {
        let mut data = self.data.lock().unwrap();
        data.memos.retain(|m| m.id != id);
        drop(data);
        let _ = self.save();
    }

    // Category operations
    pub fn get_categories(&self) -> Vec<Category> {
        self.data.lock().unwrap().categories.clone()
    }

    pub fn add_category(&self, category: Category) {
        let mut data = self.data.lock().unwrap();
        data.categories.push(category);
        drop(data);
        let _ = self.save();
    }

    pub fn delete_category(&self, id: &str) {
        let mut data = self.data.lock().unwrap();
        data.categories.retain(|c| c.id != id);
        drop(data);
        let _ = self.save();
    }

    // Settings operations
    pub fn get_settings(&self) -> AppSettings {
        self.data.lock().unwrap().settings.clone()
    }

    pub fn save_settings(&self, settings: AppSettings) {
        let mut data = self.data.lock().unwrap();
        data.settings = settings;
        drop(data);
        let _ = self.save();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoUpdate {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub category_id: Option<String>,
    #[serde(default)]
    pub reminder_at: Option<String>,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub completed: Option<bool>,
    #[serde(default)]
    pub completed_at: Option<u64>,
}
