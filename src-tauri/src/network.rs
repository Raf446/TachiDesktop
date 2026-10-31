use reqwest::header::{HeaderMap, HeaderName, HeaderValue, ORIGIN, REFERER, USER_AGENT};
use std::collections::HashMap;
use std::str::FromStr;
use std::time::{Duration, Instant};
use url::Url;

const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

fn build_spoofed_headers(
    target_url: &str,
    custom_headers: Option<HashMap<String, String>>,
) -> Result<HeaderMap, String> {
    let parsed = Url::parse(target_url).map_err(|e| format!("Invalid target URL: {e}"))?;
    let origin_base = format!(
        "{}://{}",
        parsed.scheme(),
        parsed.host_str().unwrap_or("localhost")
    );
    let referer_base = format!("{origin_base}/");

    let mut header_map = HeaderMap::new();
    header_map.insert(
        USER_AGENT,
        HeaderValue::from_static(DEFAULT_USER_AGENT),
    );
    if let Ok(origin_val) = HeaderValue::from_str(&origin_base) {
        header_map.insert(ORIGIN, origin_val);
    }
    if let Ok(referer_val) = HeaderValue::from_str(&referer_base) {
        header_map.insert(REFERER, referer_val);
    }

    if let Some(overrides) = custom_headers {
        for (key, value) in overrides {
            let name = HeaderName::from_str(key.trim())
                .map_err(|e| format!("Invalid header name '{key}': {e}"))?;
            let val = HeaderValue::from_str(value.trim())
                .map_err(|e| format!("Invalid header value for '{key}': {e}"))?;
            header_map.insert(name, val);
        }
    }

    Ok(header_map)
}

#[tauri::command]
pub async fn proxy_fetch(
    url: String,
    headers: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let header_map = build_spoofed_headers(&url, headers)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {e}"))?;

    let response = client
        .get(&url)
        .headers(header_map)
        .send()
        .await
        .map_err(|e| format!("Network request failed for {url}: {e}"))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Upstream server returned HTTP {}", status.as_u16()));
    }

    response
        .text()
        .await
        .map_err(|e| format!("Failed to decode response body: {e}"))
}

#[tauri::command]
pub async fn measure_endpoint_ping(url: String) -> Result<u64, String> {
    let header_map = build_spoofed_headers(&url, None)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .build()
        .map_err(|e| format!("Failed to initialize ping client: {e}"))?;

    let start = Instant::now();
    let _ = client
        .head(&url)
        .headers(header_map)
        .send()
        .await
        .map_err(|e| format!("Endpoint unreachable: {e}"))?;

    Ok(start.elapsed().as_millis() as u64)
}
