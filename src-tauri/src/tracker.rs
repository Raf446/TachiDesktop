use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerAccountConfig {
    pub mal_connected: bool,
    pub mal_username: String,
    pub anilist_connected: bool,
    pub anilist_username: String,
    pub auto_scrobble_enabled: bool,
    pub auto_scrobble_threshold: u8,
}

impl Default for TrackerAccountConfig {
    fn default() -> Self {
        Self {
            mal_connected: true,
            mal_username: "Raf".to_string(),
            anilist_connected: false,
            anilist_username: String::new(),
            auto_scrobble_enabled: true,
            auto_scrobble_threshold: 80,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerSyncEvent {
    pub anime_id: String,
    pub mal_id: Option<u64>,
    pub anime_title: String,
    pub episode_number: u32,
    pub total_episodes: u32,
    pub status: String,
    pub synced_at: String,
    pub provider: String,
}

fn resolve_tracker_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve AppData directory: {e}"))?;
    let tracker_dir = base_dir.join("tracker");
    if !tracker_dir.exists() {
        fs::create_dir_all(&tracker_dir)
            .map_err(|e| format!("Failed to create tracker directory: {e}"))?;
    }
    Ok(tracker_dir)
}

#[tauri::command]
pub async fn get_tracker_config(app: AppHandle) -> Result<TrackerAccountConfig, String> {
    let tracker_dir = resolve_tracker_dir(&app)?;
    let config_path = tracker_dir.join("config.json");
    if !config_path.exists() {
        return Ok(TrackerAccountConfig::default());
    }
    let raw = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read tracker config: {e}"))?;
    serde_json::from_str::<TrackerAccountConfig>(&raw)
        .or_else(|_| Ok(TrackerAccountConfig::default()))
}

#[tauri::command]
pub async fn update_tracker_config(
    app: AppHandle,
    config: TrackerAccountConfig,
) -> Result<TrackerAccountConfig, String> {
    let tracker_dir = resolve_tracker_dir(&app)?;
    let config_path = tracker_dir.join("config.json");
    let raw = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize tracker config: {e}"))?;
    fs::write(&config_path, raw)
        .map_err(|e| format!("Failed to save tracker config: {e}"))?;
    Ok(config)
}

#[tauri::command]
pub async fn sync_tracker_progress(
    app: AppHandle,
    event: TrackerSyncEvent,
) -> Result<TrackerSyncEvent, String> {
    let tracker_dir = resolve_tracker_dir(&app)?;
    let history_path = tracker_dir.join("scrobble_history.json");

    let mut history: Vec<TrackerSyncEvent> = if history_path.exists() {
        fs::read_to_string(&history_path)
            .ok()
            .and_then(|raw| serde_json::from_str(&raw).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    };

    history.retain(|item| {
        !(item.anime_id == event.anime_id && item.episode_number == event.episode_number)
    });
    history.insert(0, event.clone());
    if history.len() > 100 {
        history.truncate(100);
    }

    let serialized = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize tracker history: {e}"))?;
    fs::write(&history_path, serialized)
        .map_err(|e| format!("Failed to persist tracker history: {e}"))?;

    Ok(event)
}

#[tauri::command]
pub async fn get_scrobble_history(app: AppHandle) -> Result<Vec<TrackerSyncEvent>, String> {
    let tracker_dir = resolve_tracker_dir(&app)?;
    let history_path = tracker_dir.join("scrobble_history.json");
    if !history_path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&history_path)
        .map_err(|e| format!("Failed to read scrobble history: {e}"))?;
    serde_json::from_str::<Vec<TrackerSyncEvent>>(&raw).or_else(|_| Ok(Vec::new()))
}
