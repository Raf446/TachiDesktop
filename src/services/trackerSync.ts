import { invoke } from '@tauri-apps/api/core';
import { TrackerAccountConfig, TrackerStatus, TrackerSyncEvent } from '../types/anime';

const TRACKER_CONFIG_KEY = 'tachi_tracker_config';
const TRACKER_HISTORY_KEY = 'tachi_tracker_history';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const DEFAULT_CONFIG: TrackerAccountConfig = {
  malConnected: true,
  malUsername: 'Raf',
  anilistConnected: false,
  anilistUsername: '',
  autoScrobbleEnabled: true,
  autoScrobbleThreshold: 80,
};

export async function fetchTrackerConfig(): Promise<TrackerAccountConfig> {
  if (isTauriRuntime()) {
    try {
      return await invoke<TrackerAccountConfig>('get_tracker_config');
    } catch {
      // Fallback to localStorage
    }
  }
  const raw = localStorage.getItem(TRACKER_CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveTrackerConfig(
  config: TrackerAccountConfig
): Promise<TrackerAccountConfig> {
  localStorage.setItem(TRACKER_CONFIG_KEY, JSON.stringify(config));
  if (isTauriRuntime()) {
    try {
      return await invoke<TrackerAccountConfig>('update_tracker_config', { config });
    } catch {
      // Fallback to localStorage
    }
  }
  return config;
}

export async function scrobbleEpisodeProgress(params: {
  animeId: string;
  malId?: number;
  animeTitle: string;
  episodeNumber: number;
  totalEpisodes: number;
  status?: TrackerStatus;
}): Promise<TrackerSyncEvent> {
  const config = await fetchTrackerConfig();
  const provider: 'MyAnimeList' | 'AniList' = config.malConnected ? 'MyAnimeList' : 'AniList';
  const nextStatus: TrackerStatus =
    params.status ||
    (params.episodeNumber >= params.totalEpisodes ? 'Completed' : 'Watching');

  const event: TrackerSyncEvent = {
    animeId: params.animeId,
    malId: params.malId,
    animeTitle: params.animeTitle,
    episodeNumber: params.episodeNumber,
    totalEpisodes: params.totalEpisodes,
    status: nextStatus,
    syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    provider,
  };

  const existingHistory = await fetchScrobbleHistory();
  const filtered = existingHistory.filter(
    (item) => !(item.animeId === event.animeId && item.episodeNumber === event.episodeNumber)
  );
  const updatedHistory = [event, ...filtered].slice(0, 50);
  localStorage.setItem(TRACKER_HISTORY_KEY, JSON.stringify(updatedHistory));

  if (isTauriRuntime()) {
    try {
      await invoke<TrackerSyncEvent>('sync_tracker_progress', { event });
    } catch {
      // Already saved locally
    }
  }

  return event;
}

export async function fetchScrobbleHistory(): Promise<TrackerSyncEvent[]> {
  if (isTauriRuntime()) {
    try {
      const history = await invoke<TrackerSyncEvent[]>('get_scrobble_history');
      if (Array.isArray(history) && history.length > 0) {
        return history;
      }
    } catch {
      // Fallback to localStorage
    }
  }
  const raw = localStorage.getItem(TRACKER_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrackerSyncEvent[];
  } catch {
    return [];
  }
}

export function shouldTriggerAutoScrobble(
  watchedSec: number,
  durationSec: number,
  thresholdPercent = 80
): boolean {
  if (!durationSec || durationSec <= 0) return false;
  const ratio = (watchedSec / durationSec) * 100;
  return ratio >= thresholdPercent;
}
