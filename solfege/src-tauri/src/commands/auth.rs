use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use crate::database;
use bcrypt::{hash, verify, DEFAULT_COST};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LocalUser {
    pub id: String,
    pub username: String,
    pub role: String,
    pub nome: String,
    pub cognome: String,
}

pub struct AuthState(pub std::sync::Mutex<Option<LocalUser>>);

// ── Sessione persistente su tabella dedicata ────────────────────────────────
//
// La tabella `sessions` ha un vincolo PRIMARY KEY CHECK (id = 1) che garantisce
// una sola riga attiva per volta. INSERT OR REPLACE sovrascrive la riga ad ogni
// login. DELETE la rimuove al logout. Non vengono mai salvate password o hash.

/// Carica la sessione dal DB all'avvio dell'app.
/// Chiamato da lib.rs nel .setup() hook dopo initialize().
pub fn load_session_from_db(app: &AppHandle, state: &AuthState) {
    if let Ok(conn) = database::get_connection(app) {
        let result = conn.query_row(
            "SELECT user_id, username, role, nome, cognome FROM sessions WHERE id = 1",
            [],
            |row| {
                Ok(LocalUser {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    role: row.get(2)?,
                    nome: row.get(3)?,
                    cognome: row.get(4)?,
                })
            },
        );
        if let Ok(user) = result {
            if let Ok(mut session) = state.0.lock() {
                println!("[SESSION] Sessione ripristinata per: {}", user.username);
                *session = Some(user);
            }
        }
    }
}

fn save_session(app: &AppHandle, user: &LocalUser) -> Result<(), String> {
    let conn = database::get_connection(app).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO sessions
            (id, user_id, username, role, nome, cognome, logged_in_at, last_activity_at)
         VALUES (1, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
        [&user.id, &user.username, &user.role, &user.nome, &user.cognome],
    )
    .map_err(|e| format!("Errore scrittura DB sessione: {}", e))?;
    println!("[SESSION] Sessione SQLite salvata con successo per: {}", user.username);
    Ok(())
}

fn update_last_activity(app: &AppHandle) {
    if let Ok(conn) = database::get_connection(app) {
        let _ = conn.execute(
            "UPDATE sessions SET last_activity_at = datetime('now') WHERE id = 1",
            [],
        );
    }
}

fn clear_session(app: &AppHandle) {
    if let Ok(conn) = database::get_connection(app) {
        let _ = conn.execute("DELETE FROM sessions WHERE id = 1", []);
    }
}

// ── Comandi Tauri ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn login(
    app: AppHandle,
    state: State<'_, AuthState>,
    username: String,
    password: String,
) -> Result<LocalUser, String> {
    // Normalizza username: sempre minuscolo e senza spazi
    let username = username.trim().to_lowercase();

    let conn = database::get_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, username, password_hash, role, nome, cognome FROM users WHERE username = ?")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([&username]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: String = row.get(0).map_err(|e| e.to_string())?;
        let db_username: String = row.get(1).map_err(|e| e.to_string())?;
        let password_hash: String = row.get(2).map_err(|e| e.to_string())?;
        let role: String = row.get(3).map_err(|e| e.to_string())?;
        let nome: String = row.get(4).map_err(|e| e.to_string())?;
        let cognome: String = row.get(5).map_err(|e| e.to_string())?;

        let matches = verify(&password, &password_hash).map_err(|e| e.to_string())?;
        if matches {
            let user = LocalUser { id, username: db_username, role, nome, cognome };
            // Persisti su DB (sopravvive a navigate/reload) e in memoria
            println!("[SESSION] Password corretta. Salvo la sessione...");
            save_session(&app, &user)?;
            let mut session = state.0.lock().map_err(|_| "Failed to lock session")?;
            *session = Some(user.clone());
            Ok(user)
        } else {
            Err("Username o password non corretti.".to_string())
        }
    } else {
        Err("Username o password non corretti.".to_string())
    }
}

#[tauri::command]
pub async fn logout(
    app: AppHandle,
    state: State<'_, AuthState>,
) -> Result<(), String> {
    // Rimuove dal DB e dalla memoria
    clear_session(&app);
    let mut session = state.0.lock().map_err(|_| "Failed to lock session")?;
    *session = None;
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(
    app: AppHandle,
    state: State<'_, AuthState>,
) -> Result<Option<LocalUser>, String> {
    // 1. Controlla prima la memoria (fast path)
    {
        let session = state.0.lock().map_err(|_| "Failed to lock session")?;
        if session.is_some() {
            println!("[SESSION] get_current_user: trovata sessione in memoria");
            drop(session);
            update_last_activity(&app);
            let session = state.0.lock().map_err(|_| "Failed to lock session")?;
            return Ok(session.clone());
        }
    }

    // 2. Fallback: ricarica dal DB (caso di navigate che azzera lo stato in-memory)
    println!("[SESSION] get_current_user: sessione in memoria vuota. Cerco nel DB...");
    let conn = database::get_connection(&app).map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT user_id, username, role, nome, cognome FROM sessions WHERE id = 1",
        [],
        |row| {
            Ok(LocalUser {
                id: row.get(0)?,
                username: row.get(1)?,
                role: row.get(2)?,
                nome: row.get(3)?,
                cognome: row.get(4)?,
            })
        },
    );

    match result {
        Ok(user) => {
            // Ripristina in memoria e aggiorna activity
            update_last_activity(&app);
            let mut session = state.0.lock().map_err(|_| "Failed to lock session")?;
            *session = Some(user.clone());
            println!("[SESSION] get_current_user: sessione ripristinata da DB per: {}", user.username);
            Ok(Some(user))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            println!("[SESSION] get_current_user: nessuna sessione attiva trovata nel DB");
            Ok(None)
        }
        Err(e) => {
            eprintln!("[SESSION ERROR] get_current_user: errore query: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn create_first_user(
    app: AppHandle,
    username: String,
    password: String,
    nome: String,
    cognome: String,
) -> Result<(), String> {
    // Normalizza username: sempre minuscolo e senza spazi extra
    let username = username.trim().to_lowercase();

    let conn = database::get_connection(&app)?;

    // Verifica che non esista già un utente con lo stesso username
    let existing: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM users WHERE username = ?",
            [&username],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if existing > 0 {
        return Err(format!("Username '{}' già in uso.", username));
    }

    // Hash password con bcrypt (DEFAULT_COST = 12)
    let hashed = hash(&password, DEFAULT_COST).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (username, password_hash, role, nome, cognome) VALUES (?, ?, 'admin', ?, ?)",
        [username.as_str(), hashed.as_str(), nome.as_str(), cognome.as_str()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
