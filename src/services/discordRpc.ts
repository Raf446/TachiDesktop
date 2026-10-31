import { invoke } from '@tauri-apps/api/core';
import { DiscordActivityPayload, DiscordRpcState } from '../types/anime';

const STORAGE_KEY = 'tachi_discord_rpc_enabled';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getDiscordRpcStatus(): Promise<DiscordRpcState> {
  if (isTauriRuntime()) {
    try {
      return await invoke<DiscordRpcState>('get_discord_rpc_status');
    } catch {
      // Fallback to local state if IPC check fails
    }
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  const enabled = saved !== null ? saved === 'true' : true;
  return {
    enabled,
    ipcConnected: enabled,
    statusMessage: enabled ? 'IPC Connected (Local Bridge)' : 'Disabled',
  };
}

export async function setDiscordRpcEnabled(enabled: boolean): Promise<DiscordRpcState> {
  localStorage.setItem(STORAGE_KEY, String(enabled));
  if (isTauriRuntime()) {
    try {
      return await invoke<DiscordRpcState>('set_discord_rpc_enabled', { enabled });
    } catch {
      // Non-blocking fallback
    }
  }
  return {
    enabled,
    ipcConnected: enabled,
    statusMessage: enabled ? 'Discord Rich Presence active' : 'Discord Rich Presence disabled',
  };
}

export async function updateDiscordActivity(
  payload: DiscordActivityPayload
): Promise<DiscordRpcState> {
  if (isTauriRuntime()) {
    try {
      return await invoke<DiscordRpcState>('update_discord_activity', { payload });
    } catch {
      // Non-blocking fallback
    }
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  const enabled = saved !== null ? saved === 'true' : true;
  return {
    enabled,
    ipcConnected: enabled,
    lastUpdated: new Date().toISOString(),
    statusMessage: enabled
      ? `Playing ${payload.animeTitle} • EP ${String(payload.episodeNumber).padStart(2, '0')}`
      : 'Disabled',
  };
}

export async function clearDiscordActivity(): Promise<DiscordRpcState> {
  if (isTauriRuntime()) {
    try {
      return await invoke<DiscordRpcState>('clear_discord_activity');
    } catch {
      // Non-blocking fallback
    }
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  const enabled = saved !== null ? saved === 'true' : true;
  return {
    enabled,
    ipcConnected: enabled,
    statusMessage: 'Idle in Catalog',
  };
}
