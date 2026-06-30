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

#[tauri::command]
pub async fn login(
    app: AppHandle,
    state: State<'_, AuthState>,
    username: String,
    password: String,
) -> Result<LocalUser, String> {
    // Normalizza username: sempre minuscolo e senza spazi — coerente con create_first_user
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
            let user = LocalUser {
                id,
                username: db_username,
                role,
                nome,
                cognome,
            };
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
pub async fn logout(state: State<'_, AuthState>) -> Result<(), String> {
    let mut session = state.0.lock().map_err(|_| "Failed to lock session")?;
    *session = None;
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(state: State<'_, AuthState>) -> Result<Option<LocalUser>, String> {
    let session = state.0.lock().map_err(|_| "Failed to lock session")?;
    Ok(session.clone())
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
