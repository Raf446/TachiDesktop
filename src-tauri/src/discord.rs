pub const DISCORD_APP_ID: &str = "123456789012345678"; // Developer ganti Application ID di sini

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordRpcStatus {
    pub enabled: bool,
    pub ipc_connected: bool,
    pub status_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordActivityInput {
    pub anime_title: String,
    pub episode_number: u32,
    pub episode_title: String,
    pub current_time_sec: u64,
    pub duration_sec: u64,
    pub poster_url: Option<String>,
    pub source_name: Option<String>,
    pub is_paused: Option<bool>,
}

pub struct DiscordInnerState {
    pub enabled: bool,
    pub ipc_connected: bool,
    pub last_activity: Option<DiscordActivityInput>,
}

#[derive(Clone)]
pub struct DiscordState(pub Arc<Mutex<DiscordInnerState>>);

impl Default for DiscordState {
    fn default() -> Self {
        Self(Arc::new(Mutex::new(DiscordInnerState {
            enabled: true,
            ipc_connected: false,
            last_activity: None,
        })))
    }
}

fn dispatch_ipc_activity(payload: Option<DiscordActivityInput>) -> bool {
    let Ok(mut client) = DiscordIpcClient::new(DISCORD_APP_ID) else {
        return false;
    };

    if client.connect().is_err() {
        return false;
    }

    let result = match payload {
        Some(data) => {
            let paused = data.is_paused.unwrap_or(false);
            let state_line = if paused {
                format!("Paused • EP {:02} - {}", data.episode_number, data.episode_title)
            } else {
                format!("EP {:02} • {}", data.episode_number, data.episode_title)
            };

            let source_badge = data
                .source_name
                .unwrap_or_else(|| "TachiDesktop Clean Shell".to_string());
            let large_image = data
                .poster_url
                .unwrap_or_else(|| "tachidesktop_logo".to_string());

            let now_unix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);

            let start_ts = now_unix.saturating_sub(data.current_time_sec as i64);
            let end_ts = start_ts.saturating_add(data.duration_sec as i64);

            let mut act = activity::Activity::new()
                .details(&data.anime_title)
                .state(&state_line)
                .assets(
                    activity::Assets::new()
                        .large_image(&large_image)
                        .large_text(&source_badge),
                );

            if !paused && data.duration_sec > 0 {
                act = act.timestamps(
                    activity::Timestamps::new()
                        .start(start_ts)
                        .end(end_ts),
                );
            }

            client.set_activity(act).is_ok()
        }
        None => client.clear_activity().is_ok(),
    };

    let _ = client.close();
    result
}

#[tauri::command]
pub async fn set_discord_rpc_enabled(
    state: State<'_, DiscordState>,
    enabled: bool,
) -> Result<DiscordRpcStatus, String> {
    let cached_activity = {
        let mut guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
        guard.enabled = enabled;
        if !enabled {
            guard.ipc_connected = false;
            None
        } else {
            guard.last_activity.clone()
        }
    };

    let state_clone = state.0.clone();
    tokio::task::spawn_blocking(move || {
        let connected = if enabled {
            dispatch_ipc_activity(cached_activity)
        } else {
            let _ = dispatch_ipc_activity(None);
            false
        };
        if let Ok(mut guard) = state_clone.lock() {
            guard.ipc_connected = connected;
        }
    });

    let guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
    Ok(DiscordRpcStatus {
        enabled: guard.enabled,
        ipc_connected: guard.ipc_connected,
        status_message: if guard.enabled {
            "Discord Rich Presence active".to_string()
        } else {
            "Discord Rich Presence disabled".to_string()
        },
    })
}

#[tauri::command]
pub async fn update_discord_activity(
    state: State<'_, DiscordState>,
    payload: DiscordActivityInput,
) -> Result<DiscordRpcStatus, String> {
    let is_enabled = {
        let mut guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
        guard.last_activity = Some(payload.clone());
        guard.enabled
    };

    if is_enabled {
        let state_clone = state.0.clone();
        tokio::task::spawn_blocking(move || {
            let connected = dispatch_ipc_activity(Some(payload));
            if let Ok(mut guard) = state_clone.lock() {
                guard.ipc_connected = connected;
            }
        });
    }

    let guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
    Ok(DiscordRpcStatus {
        enabled: guard.enabled,
        ipc_connected: guard.ipc_connected,
        status_message: if guard.ipc_connected {
            "IPC Connected".to_string()
        } else {
            "IPC Standby (Non-blocking)".to_string()
        },
    })
}

#[tauri::command]
pub async fn clear_discord_activity(
    state: State<'_, DiscordState>,
) -> Result<DiscordRpcStatus, String> {
    {
        let mut guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
        guard.last_activity = None;
    }

    let state_clone = state.0.clone();
    tokio::task::spawn_blocking(move || {
        let connected = dispatch_ipc_activity(None);
        if let Ok(mut guard) = state_clone.lock() {
            guard.ipc_connected = connected;
        }
    });

    let guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
    Ok(DiscordRpcStatus {
        enabled: guard.enabled,
        ipc_connected: guard.ipc_connected,
        status_message: "Activity cleared".to_string(),
    })
}

#[tauri::command]
pub async fn get_discord_rpc_status(
    state: State<'_, DiscordState>,
) -> Result<DiscordRpcStatus, String> {
    let guard = state.0.lock().map_err(|_| "Discord state lock poisoned")?;
    Ok(DiscordRpcStatus {
        enabled: guard.enabled,
        ipc_connected: guard.ipc_connected,
        status_message: if guard.enabled {
            "Active".to_string()
        } else {
            "Disabled".to_string()
        },
    })
}
