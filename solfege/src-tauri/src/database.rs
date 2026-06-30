use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use rusqlite::Connection;
use std::path::PathBuf;

pub fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("solfege.db");
    Ok(path)
}

pub fn get_connection(app: &AppHandle) -> Result<Connection, String> {
    let path = get_db_path(app)?;
    Connection::open(path).map_err(|e| e.to_string())
}

pub async fn initialize(_app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Le migrazioni vengono gestite da tauri-plugin-sql
    // Il file solfege.db viene creato automaticamente in AppData/Application Support
    Ok(())
}

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        }
    ]
}
