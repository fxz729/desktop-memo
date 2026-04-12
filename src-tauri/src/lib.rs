mod commands;
mod storage;
mod scheduler;

use commands::{memo, category, settings, window};
use storage::store::AppStore;
use scheduler::reminder::ReminderScheduler;
use std::sync::Arc;
use tauri::{Manager, Emitter};
use tauri_plugin_autostart::MacosLauncher;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn run() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive(tracing::Level::INFO.into()))
        .init();

    tracing::info!("Starting 桌面备忘录 v1.0.0");

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--hidden"])))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            tracing::info!("Setting up application");

            // Initialize store
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            let store = Arc::new(AppStore::new(&app_data_dir)
                .expect("Failed to initialize store"));

            // Initialize reminder scheduler
            let app_handle = app.handle().clone();
            let scheduler = Arc::new(ReminderScheduler::new(app_handle));

            // Load existing reminders
            let memos = store.get_memos();
            let scheduler_clone = scheduler.clone();
            let runtime = tokio::runtime::Runtime::new()
                .expect("Failed to create runtime");
            runtime.block_on(async {
                scheduler_clone.load_reminders(&memos).await;
            });

            // Manage state
            app.manage(store);
            app.manage(scheduler);

            // Setup tray
            let window = app.get_webview_window("main").unwrap();
            setup_tray(&window);

            tracing::info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            memo::get_memos,
            memo::create_memo,
            memo::update_memo,
            memo::delete_memo,
            memo::complete_memo,
            category::get_categories,
            category::create_category,
            category::delete_category,
            settings::get_settings,
            settings::save_settings,
            settings::set_auto_start,
            window::set_opacity,
            window::set_always_on_top,
            window::reset_position,
            window::minimize,
            window::close,
            window::start_dragging,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(window: &tauri::WebviewWindow) {
    use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
    use tauri::menu::{Menu, MenuItem};

    let show_item = MenuItem::with_id(window, "show", "显示", true, None::<&str>).unwrap();
    let quit_item = MenuItem::with_id(window, "quit", "退出", true, None::<&str>).unwrap();

    let menu = Menu::with_items(window, &[&show_item, &quit_item]).unwrap();

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("桌面备忘录")
        .on_menu_event(move |window, event| {
            match event.id.as_ref() {
                "show" => {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(window)
        .unwrap();
}
