use serde_json::json;
use tauri::AppHandle;
use crate::commands::config::get_config;

#[tauri::command]
pub async fn report_error(
    app: AppHandle,
    license_key: Option<String>,
    error_type: String,
    message: String,
    stack: Option<String>,
    screen: Option<String>,
    action: Option<String>,
    app_version: String,
    os_info: String,
) -> Result<(), String> {
    tokio::spawn(async move {
        // Try to resolve license key from configuration if not provided
        let resolved_key = match license_key {
            Some(k) if !k.is_empty() => k,
            _ => get_config(app, "license_key".to_string())
                .await
                .unwrap_or_default()
                .unwrap_or_default(),
        };

        let client = reqwest::Client::new();
        let payload = json!({
            "license_key": resolved_key,
            "error_type": error_type,
            "error_message": message,
            "error_stack": stack,
            "screen_name": screen,
            "action_performed": action,
            "app_version": app_version,
            "os_info": os_info
        });

        let _ = client
            .post("https://solfege-five.vercel.app/api/error-report")
            .json(&payload)
            .send()
            .await;
    });
    Ok(())
}
