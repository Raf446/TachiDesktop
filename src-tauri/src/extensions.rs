use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedPluginRules {
    pub search_path: String,
    pub popular_path: String,
    pub episode_selector: String,
    pub stream_selector: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredExtensionPlugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub lang: String,
    pub base_url: String,
    pub default_base_url: String,
    pub source_repo_url: String,
    pub generated_js_code: String,
    pub ping_ms: u64,
    pub has_update: Option<bool>,
    pub is_builtin: Option<bool>,
    pub updated_at: String,
    pub extracted_rules: Option<ExtractedPluginRules>,
}

fn resolve_plugins_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve AppData directory: {e}"))?;
    let plugins_dir = base_dir.join("plugins");
    if !plugins_dir.exists() {
        fs::create_dir_all(&plugins_dir)
            .map_err(|e| format!("Failed to create plugins directory: {e}"))?;
    }
    Ok(plugins_dir)
}

fn sanitize_plugin_id(raw_id: &str) -> String {
    raw_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>()
        .to_lowercase()
}

fn read_manifest(plugins_dir: &PathBuf) -> Vec<StoredExtensionPlugin> {
    let manifest_path = plugins_dir.join("manifest.json");
    if !manifest_path.exists() {
        return Vec::new();
    }
    fs::read_to_string(&manifest_path)
        .ok()
        .and_then(|raw| serde_json::from_str::<Vec<StoredExtensionPlugin>>(&raw).ok())
        .unwrap_or_default()
}

fn write_manifest(plugins_dir: &PathBuf, list: &[StoredExtensionPlugin]) -> Result<(), String> {
    let manifest_path = plugins_dir.join("manifest.json");
    let serialized = serde_json::to_string_pretty(list)
        .map_err(|e| format!("Failed to serialize plugin manifest: {e}"))?;
    fs::write(manifest_path, serialized)
        .map_err(|e| format!("Failed to write plugin manifest: {e}"))
}

#[tauri::command]
pub async fn save_extension_plugin(
    app: AppHandle,
    mut plugin: StoredExtensionPlugin,
) -> Result<StoredExtensionPlugin, String> {
    let plugins_dir = resolve_plugins_dir(&app)?;
    let safe_id = sanitize_plugin_id(&plugin.id);
    if safe_id.is_empty() {
        return Err("Plugin ID cannot be empty".to_string());
    }
    plugin.id = safe_id.clone();

    let js_file_path = plugins_dir.join(format!("{safe_id}.js"));
    fs::write(&js_file_path, &plugin.generated_js_code)
        .map_err(|e| format!("Failed to write plugin JS file: {e}"))?;

    let mut manifest = read_manifest(&plugins_dir);
    if let Some(existing) = manifest.iter_mut().find(|item| item.id == safe_id) {
        *existing = plugin.clone();
    } else {
        manifest.push(plugin.clone());
    }
    write_manifest(&plugins_dir, &manifest)?;

    Ok(plugin)
}

#[tauri::command]
pub async fn load_extension_plugins(app: AppHandle) -> Result<Vec<StoredExtensionPlugin>, String> {
    let plugins_dir = resolve_plugins_dir(&app)?;
    let mut manifest = read_manifest(&plugins_dir);

    for item in manifest.iter_mut() {
        let js_file_path = plugins_dir.join(format!("{}.js", item.id));
        if let Ok(disk_js) = fs::read_to_string(&js_file_path) {
            if !disk_js.trim().is_empty() {
                item.generated_js_code = disk_js;
            }
        }
    }

    Ok(manifest)
}

#[tauri::command]
pub async fn update_extension_base_url(
    app: AppHandle,
    id: String,
    new_base_url: String,
) -> Result<StoredExtensionPlugin, String> {
    let plugins_dir = resolve_plugins_dir(&app)?;
    let safe_id = sanitize_plugin_id(&id);
    let trimmed_url = new_base_url.trim().trim_end_matches('/').to_string();

    let mut manifest = read_manifest(&plugins_dir);
    let target = manifest
        .iter_mut()
        .find(|item| item.id == safe_id)
        .ok_or_else(|| format!("Plugin '{safe_id}' not found in local storage"))?;

    let old_base = target.base_url.clone();
    target.base_url = trimmed_url.clone();

    if !old_base.is_empty() && target.generated_js_code.contains(&old_base) {
        target.generated_js_code = target.generated_js_code.replace(&old_base, &trimmed_url);
    }

    let js_file_path = plugins_dir.join(format!("{safe_id}.js"));
    fs::write(&js_file_path, &target.generated_js_code)
        .map_err(|e| format!("Failed to update JS file on disk: {e}"))?;

    let updated = target.clone();
    write_manifest(&plugins_dir, &manifest)?;
    Ok(updated)
}

#[tauri::command]
pub async fn delete_extension_plugin(app: AppHandle, id: String) -> Result<bool, String> {
    let plugins_dir = resolve_plugins_dir(&app)?;
    let safe_id = sanitize_plugin_id(&id);

    let js_file_path = plugins_dir.join(format!("{safe_id}.js"));
    if js_file_path.exists() {
        let _ = fs::remove_file(js_file_path);
    }

    let mut manifest = read_manifest(&plugins_dir);
    let initial_len = manifest.len();
    manifest.retain(|item| item.id != safe_id);
    write_manifest(&plugins_dir, &manifest)?;

    Ok(manifest.len() < initial_len)
}
