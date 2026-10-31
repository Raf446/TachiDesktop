import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Search, Tv, CheckCircle2 } from 'lucide-react';
import { DiscordRpcState, TrackerAccountConfig } from '../../types/anime';

interface TitlebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCommandPalette: () => void;
  discordStatus: DiscordRpcState;
  onToggleDiscordQuick?: () => void;
  trackerConfig: TrackerAccountConfig;
  onNavigateSettings?: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  discordStatus,
  onToggleDiscordQuick,
  trackerConfig,
  onNavigateSettings,
}) => {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      await getCurrentWindow().minimize();
    } catch {
      // Ignore outside Tauri context
    }
  };

  const handleToggleMaximize = async () => {
    if (!isTauri) return;
    try {
      await getCurrentWindow().toggleMaximize();
    } catch {
      // Ignore outside Tauri context
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      await getCurrentWindow().close();
    } catch {
      // Ignore outside Tauri context
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-11 w-full bg-[#111317] border-b border-white/[0.07] flex items-center justify-between px-3 select-none shrink-0 z-40"
    >
      {/* Left: App Icon & Brand */}
      <div data-tauri-drag-region className="flex items-center gap-2.5 min-w-[210px]">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center border border-indigo-400/30 shadow-inner">
          <Tv className="w-3.5 h-3.5 text-white" />
        </div>
        <div data-tauri-drag-region className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-tight text-zinc-100">
            TachiDesktop
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
            v2.0
          </span>
        </div>
      </div>

      {/* Center: Global Search Input + Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onOpenCommandPalette}
            placeholder="Search anime, manga, extensions..."
            className="w-full h-7 pl-8 pr-16 bg-[#090a0d] text-xs text-zinc-200 placeholder:text-zinc-500 rounded-md border border-white/[0.07] focus:outline-none focus:border-indigo-500/70 transition-colors"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Ctrl+K)"
            className="absolute right-1.5 px-1.5 py-0.5 rounded bg-[#161920] border border-white/[0.07] font-mono text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ⌘K
          </button>
        </div>
      </div>

      {/* Right: Discord RPC Indicator, MAL Tracker Pill & Window Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDiscordQuick}
          title={
            discordStatus.enabled
              ? 'Discord Rich Presence Active (Click to toggle)'
              : 'Discord Rich Presence Disabled (Click to enable)'
          }
          className="h-6 px-2.5 rounded bg-[#161920] hover:bg-[#1c2029] border border-white/[0.07] flex items-center gap-1.5 transition-colors"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              discordStatus.enabled ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
          />
          <span className="text-[11px] font-medium text-zinc-300">
            {discordStatus.enabled ? 'Discord RPC Active' : 'Discord RPC Off'}
          </span>
        </button>

        <button
          type="button"
          onClick={onNavigateSettings}
          title="MyAnimeList Auto-Scrobbler Sync"
          className="h-6 px-2.5 rounded bg-[#161920] hover:bg-[#1c2029] border border-white/[0.07] flex items-center gap-1.5 transition-colors"
        >
          <span className="text-[10px] font-semibold px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            MyAnimeList
          </span>
          <span className="text-[11px] font-mono text-zinc-200">
            {trackerConfig.malUsername || 'Raf'}
          </span>
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        </button>

        <div className="h-4 w-[1px] bg-white/[0.07] mx-1" />

        {/* Native Window Controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleMinimize}
            aria-label="Minimize window"
            className="w-7 h-7 rounded hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleMaximize}
            aria-label="Maximize window"
            className="w-7 h-7 rounded hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close window"
            className="w-7 h-7 rounded hover:bg-rose-500/20 flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
