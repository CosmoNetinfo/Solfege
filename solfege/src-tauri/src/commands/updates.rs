use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<bool, String> {
    if let Ok(updater) = app.updater() {
        match updater.check().await {
            Ok(update_opt) => Ok(update_opt.is_some()),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Ok(false)
    }
}
