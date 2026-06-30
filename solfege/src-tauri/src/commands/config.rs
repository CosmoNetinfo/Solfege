use tauri::AppHandle;
use crate::database;

#[tauri::command]
pub async fn get_config(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let conn = database::get_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT value FROM app_config WHERE key = ?")
        .map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query([key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let val: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(Some(val))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn set_config(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let conn = database::get_connection(&app)?;
    conn.execute(
        "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        [key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
