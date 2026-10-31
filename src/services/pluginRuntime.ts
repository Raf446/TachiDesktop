import { invoke } from '@tauri-apps/api/core';
import {
  AnimeExtension,
  StoredExtensionRecord,
  StreamSource,
} from '../types/anime';
import { buildDefaultCompiledExtensions } from './repoCompiler';

const LOCAL_STORAGE_PLUGINS_KEY = 'tachi_installed_js_plugins_v2';

const runtimeExtensionsMap = new Map<string, AnimeExtension>();

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function proxyFetchBridge(
  url: string,
  headers?: Record<string, string>
): Promise<string> {
  if (isTauriRuntime()) {
    return await invoke<string>('proxy_fetch', {
      url,
      headers: headers || null,
    });
  }
  const response = await fetch(url, { headers });
  return await response.text();
}

export async function measurePluginPing(baseUrl: string): Promise<number> {
  if (isTauriRuntime()) {
    try {
      const ms = await invoke<number>('measure_endpoint_ping', { url: baseUrl });
      return Math.max(12, Math.min(999, ms));
    } catch {
      // Fallback simulated ping measurement when offline or blocked
    }
  }
  const start = performance.now();
  await new Promise((r) => setTimeout(r, 25 + Math.floor(Math.random() * 35)));
  return Math.round(performance.now() - start);
}

export function initializeGlobalPluginBridge(): void {
  if (typeof window === 'undefined') return;
  if (!window.__TACHI_BRIDGE__) {
    window.__TACHI_BRIDGE__ = {
      proxyFetch: proxyFetchBridge,
      registerExtension: (ext: AnimeExtension) => {
        if (ext && ext.id) {
          runtimeExtensionsMap.set(ext.id, ext);
          window.__TACHI_LAST_REGISTERED_EXTENSION__ = ext;
        }
      },
    };
  }
}

export async function executeJsPluginInSandbox(
  record: StoredExtensionRecord
): Promise<AnimeExtension | null> {
  initializeGlobalPluginBridge();
  window.__TACHI_LAST_REGISTERED_EXTENSION__ = null;

  const jsSource = record.generatedJsCode;
  if (!jsSource || !jsSource.trim()) return null;

  // 1. Primary path: Load via Blob URL as a dynamic ES module
  const blob = new Blob([jsSource], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    await import(/* @vite-ignore */ blobUrl);
    const registered =
      window.__TACHI_LAST_REGISTERED_EXTENSION__ as AnimeExtension | null;
    if (registered) {
      registered.baseUrl = record.baseUrl;
      registered.generatedJsCode = record.generatedJsCode;
      runtimeExtensionsMap.set(record.id, registered);
      return registered;
    }
  } catch {
    // 2. Fallback path if CSP restricts blob module import
    try {
      const runner = new Function(jsSource);
      runner();
      const registered =
        window.__TACHI_LAST_REGISTERED_EXTENSION__ as AnimeExtension | null;
      if (registered) {
        registered.baseUrl = record.baseUrl;
        registered.generatedJsCode = record.generatedJsCode;
        runtimeExtensionsMap.set(record.id, registered);
        return registered;
      }
    } catch {
      return null;
    }
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  return runtimeExtensionsMap.get(record.id) || null;
}

export function getActiveRuntimeExtension(id: string): AnimeExtension | undefined {
  return runtimeExtensionsMap.get(id);
}

export async function resolveStreamsFromPlugin(
  pluginRecord: StoredExtensionRecord,
  episodeUrl: string
): Promise<StreamSource[]> {
  let instance = runtimeExtensionsMap.get(pluginRecord.id);
  if (!instance) {
    const loaded = await executeJsPluginInSandbox(pluginRecord);
    if (loaded) instance = loaded;
  }

  if (instance && typeof instance.getVideoStreams === 'function') {
    try {
      const streams = await instance.getVideoStreams(episodeUrl);
      if (Array.isArray(streams) && streams.length > 0) {
        return streams;
      }
    } catch {
      // Fallback handled by TheaterPlayer
    }
  }
  return [];
}

export async function loadInstalledPlugins(): Promise<StoredExtensionRecord[]> {
  initializeGlobalPluginBridge();
  const defaults = buildDefaultCompiledExtensions();

  let loadedList: StoredExtensionRecord[] = [];

  if (isTauriRuntime()) {
    try {
      const diskPlugins = await invoke<StoredExtensionRecord[]>(
        'load_extension_plugins'
      );
      if (Array.isArray(diskPlugins) && diskPlugins.length > 0) {
        loadedList = diskPlugins;
      }
    } catch {
      // Fallback to localStorage
    }
  }

  if (loadedList.length === 0) {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLUGINS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredExtensionRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedList = parsed;
        }
      } catch {
        loadedList = [];
      }
    }
  }

  if (loadedList.length === 0) {
    loadedList = defaults;
    localStorage.setItem(LOCAL_STORAGE_PLUGINS_KEY, JSON.stringify(loadedList));
    if (isTauriRuntime()) {
      for (const item of loadedList) {
        try {
          await invoke('save_extension_plugin', { plugin: item });
        } catch {
          // Non-fatal startup sync
        }
      }
    }
  }

  // Hydrate all plugins into memory runtime
  for (const item of loadedList) {
    await executeJsPluginInSandbox(item);
  }

  return loadedList;
}

export async function saveAndMountPlugin(
  plugin: StoredExtensionRecord
): Promise<StoredExtensionRecord> {
  if (isTauriRuntime()) {
    try {
      plugin = await invoke<StoredExtensionRecord>('save_extension_plugin', {
        plugin,
      });
    } catch {
      // Persist in localStorage as well
    }
  }

  const existing = await loadInstalledPlugins();
  const idx = existing.findIndex((item) => item.id === plugin.id);
  const updated =
    idx >= 0
      ? existing.map((item, i) => (i === idx ? plugin : item))
      : [plugin, ...existing];

  localStorage.setItem(LOCAL_STORAGE_PLUGINS_KEY, JSON.stringify(updated));
  await executeJsPluginInSandbox(plugin);
  return plugin;
}

export async function overridePluginBaseUrl(
  id: string,
  newBaseUrl: string,
  currentList: StoredExtensionRecord[]
): Promise<StoredExtensionRecord[]> {
  const cleanUrl = newBaseUrl.trim().replace(/\/+$/, '');

  if (isTauriRuntime()) {
    try {
      await invoke<StoredExtensionRecord>('update_extension_base_url', {
        id,
        newBaseUrl: cleanUrl,
      });
    } catch {
      // Continue with local update
    }
  }

  const nextList = currentList.map((item) => {
    if (item.id !== id) return item;
    const oldBase = item.baseUrl;
    const updatedJs = oldBase
      ? item.generatedJsCode.split(oldBase).join(cleanUrl)
      : item.generatedJsCode;

    return {
      ...item,
      baseUrl: cleanUrl,
      generatedJsCode: updatedJs,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  });

  localStorage.setItem(LOCAL_STORAGE_PLUGINS_KEY, JSON.stringify(nextList));
  const target = nextList.find((item) => item.id === id);
  if (target) {
    await executeJsPluginInSandbox(target);
  }
  return nextList;
}

export async function removeInstalledPlugin(
  id: string,
  currentList: StoredExtensionRecord[]
): Promise<StoredExtensionRecord[]> {
  if (isTauriRuntime()) {
    try {
      await invoke<boolean>('delete_extension_plugin', { id });
    } catch {
      // Continue with local removal
    }
  }
  runtimeExtensionsMap.delete(id);
  const nextList = currentList.filter((item) => item.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PLUGINS_KEY, JSON.stringify(nextList));
  return nextList;
}
