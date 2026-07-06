use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
use rusqlite::Connection;
use std::path::PathBuf;

pub fn get_db_path(_app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or("Impossibile trovare la directory dell'eseguibile")?
        .to_path_buf();
    path.push("solfege.db");
    Ok(path)
}

pub fn get_connection(app: &AppHandle) -> Result<Connection, String> {
    let path = get_db_path(app)?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    // Imposta busy_timeout a 5 secondi per attendere che altri blocchi vengano rilasciati
    conn.busy_timeout(std::time::Duration::from_millis(5000)).map_err(|e| e.to_string())?;
    // Abilita la modalità WAL (Write-Ahead Logging) per consentire letture e scritture concorrenti senza lock
    let _ = conn.execute("PRAGMA journal_mode=WAL;", []);
    Ok(conn)
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
        // Per install esistenti: assicura che le tabelle sessions e school_notices esistano
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                role TEXT NOT NULL,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                logged_in_at TEXT NOT NULL DEFAULT (datetime('now')),
                last_activity_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS school_notices (
                id TEXT PRIMARY KEY,
                titolo TEXT NOT NULL,
                contenuto TEXT NOT NULL,
                importante INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );"
        )?;
        println!("Database già inizializzato. Tabelle sessions e school_notices verificate.");
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
