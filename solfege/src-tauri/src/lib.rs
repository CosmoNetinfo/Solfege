mod commands;
mod database;

pub fn run() {
    let migrations = database::get_migrations();
    tauri::Builder::default()
        .manage(commands::auth::AuthState(std::sync::Mutex::new(None)))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:solfege.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Inizializza database in modo sincrono al primo avvio per evitare race conditions
            database::initialize(app.handle()).unwrap_or_else(|e| {
                eprintln!("Errore inizializzazione DB: {}", e);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_current_user,
            commands::auth::create_first_user,
            commands::license::check_license,
            commands::license::activate_license,
            commands::license::get_trial_status,
            commands::updates::check_for_updates,
            commands::errors::report_error,
            commands::config::get_config,
            commands::config::set_config,
        ])
        .run(tauri::generate_context!())
        .expect("Errore avvio applicazione Solfège");
}
