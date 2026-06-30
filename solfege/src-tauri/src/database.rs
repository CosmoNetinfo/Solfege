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

pub fn initialize(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let conn = get_connection(app)?;
    
    // Controlla se la tabella app_config esiste già
    let table_exists: bool = conn.query_row(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='app_config'",
        [],
        |row| row.get(0),
    ).unwrap_or(0) > 0;

    if !table_exists {
        println!("Tabella app_config non trovata. Eseguo migrazione iniziale...");
        let initial_sql = include_str!("../migrations/001_initial.sql");
        conn.execute_batch(initial_sql)?;
        println!("Migrazione iniziale completata con successo!");
    } else {
        println!("Database già inizializzato.");
    }
    
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
