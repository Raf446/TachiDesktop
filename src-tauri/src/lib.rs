pub mod discord;
pub mod extensions;
pub mod network;
pub mod tracker;

use discord::DiscordState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DiscordState::default())
        .invoke_handler(tauri::generate_handler![
            network::proxy_fetch,
            network::measure_endpoint_ping,
            discord::set_discord_rpc_enabled,
            discord::update_discord_activity,
            discord::clear_discord_activity,
            discord::get_discord_rpc_status,
            extensions::save_extension_plugin,
            extensions::load_extension_plugins,
            extensions::update_extension_base_url,
            extensions::delete_extension_plugin,
            tracker::get_tracker_config,
            tracker::update_tracker_config,
            tracker::sync_tracker_progress,
            tracker::get_scrobble_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running TachiDesktop application");
}
