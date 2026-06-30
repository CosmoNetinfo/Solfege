use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use crate::commands::config::{get_config, set_config};
use chrono::{DateTime, Utc};
use serde_json::json;

#[derive(Serialize, Deserialize, Debug)]
pub struct TrialStatus {
    pub is_trial: bool,
    pub days_remaining: i32,
    pub is_expired: bool,
    pub license_key: Option<String>,
}

#[tauri::command]
pub async fn get_trial_status(app: AppHandle) -> Result<TrialStatus, String> {
    // Check if full license is active
    let license_status = get_config(app.clone(), "license_status".to_string())
        .await?
        .unwrap_or_else(|| "inactive".to_string());
    
    let license_key = get_config(app.clone(), "license_key".to_string()).await?;

    if license_status == "active" {
        return Ok(TrialStatus {
            is_trial: false,
            days_remaining: 0,
            is_expired: false,
            license_key,
        });
    }

    // Get trial start date
    let trial_start_opt = get_config(app.clone(), "trial_started_at".to_string()).await?;
    let trial_start_str = match trial_start_opt {
        Some(s) => s,
        None => {
            let now = Utc::now().to_rfc3339();
            set_config(app.clone(), "trial_started_at".to_string(), now.clone()).await?;
            now
        }
    };

    let start_date = DateTime::parse_from_rfc3339(&trial_start_str)
        .map_err(|e| e.to_string())?
        .with_timezone(&Utc);
    
    let now = Utc::now();
    let duration = now.signed_duration_since(start_date);
    let days_passed = duration.num_days() as i32;
    let days_remaining = 15 - days_passed;

    if days_remaining <= 0 {
        Ok(TrialStatus {
            is_trial: true,
            days_remaining: 0,
            is_expired: true,
            license_key,
        })
    } else {
        Ok(TrialStatus {
            is_trial: true,
            days_remaining,
            is_expired: false,
            license_key,
        })
    }
}

#[tauri::command]
pub async fn check_license(app: AppHandle) -> Result<bool, String> {
    let license_status = get_config(app, "license_status".to_string())
        .await?
        .unwrap_or_else(|| "inactive".to_string());
    Ok(license_status == "active")
}

#[tauri::command]
pub async fn activate_license(
    app: AppHandle,
    license_key: String,
    machine_id: String,
) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let os_info = std::env::consts::OS.to_string();
    let app_version = "1.0.0"; // default desktop version

    let payload = json!({
        "license_key": license_key,
        "machine_id": machine_id,
        "app_version": app_version,
        "os_info": os_info
    });

    let res = client
        .post("https://solfege-five.vercel.app/api/activate-license")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Impossibile connettersi al server di attivazione: {}", e))?;

    if res.status().is_success() {
        // Save to config
        set_config(app.clone(), "license_key".to_string(), license_key).await?;
        set_config(app.clone(), "license_status".to_string(), "active".to_string()).await?;
        Ok(true)
    } else {
        let err_body: serde_json::Value = res
            .json()
            .await
            .unwrap_or_else(|_| json!({ "error": "Errore di attivazione generico" }));
        let err_msg = err_body["error"].as_str().unwrap_or("Errore di attivazione generico");
        Err(err_msg.to_string())
    }
}
