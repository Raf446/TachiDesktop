import React from 'react';
import { Terminal, X, Activity } from 'lucide-react';
import { PlayerStats } from '../../types/anime';

interface StatsForNerdsProps {
  visible: boolean;
  stats: PlayerStats;
  onClose: () => void;
}

export const StatsForNerds: React.FC<StatsForNerdsProps> = ({
  visible,
  stats,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute top-16 left-5 z-30 w-80 rounded-lg bg-[#14171e]/90 backdrop-blur-xl border border-white/[0.09] p-3.5 text-xs shadow-2xl select-text">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-100">
            MPV / IINA Stats for Nerds
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-100 p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-400">Video / Audio Codec</span>
          <span className="text-zinc-100">{stats.codec}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Resolution / FPS</span>
          <span className="text-zinc-100">
            {stats.resolution} @ {stats.fps} fps
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Stream Bitrate</span>
          <span className="text-indigo-300">{stats.bitrateKbps} kbps</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Buffer Health</span>
          <span className="text-emerald-400">
            {stats.bufferHealthSec.toFixed(1)}s ({stats.droppedFrames} dropped)
          </span>
        </div>
        <div className="h-[1px] bg-white/[0.06] my-1.5" />
        <div className="flex justify-between">
          <span className="text-zinc-400">Active .JS Plugin</span>
          <span className="text-amber-300">{stats.activePluginName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Mirror Server</span>
          <span className="text-zinc-100">
            {stats.mirrorServer} ({stats.streamType.toUpperCase()})
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-400 shrink-0">Referer Header</span>
          <span className="text-zinc-300 truncate">{stats.refererHeader}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Endpoint Latency</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {stats.latencyPingMs}ms
          </span>
        </div>
      </div>
    </div>
  );
};
