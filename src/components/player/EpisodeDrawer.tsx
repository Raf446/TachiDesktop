import React, { useState } from 'react';
import { X, Search, Play, Check } from 'lucide-react';
import { EpisodeItem } from '../../types/anime';
import { formatTimestamp } from '../../services/anilistApi';

interface EpisodeDrawerProps {
  isOpen: boolean;
  episodes: EpisodeItem[];
  currentEpisodeId: string;
  animeTitle: string;
  onSelectEpisode: (ep: EpisodeItem) => void;
  onClose: () => void;
}

export const EpisodeDrawer: React.FC<EpisodeDrawerProps> = ({
  isOpen,
  episodes,
  currentEpisodeId,
  animeTitle,
  onSelectEpisode,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = episodes.filter((ep) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      String(ep.number).includes(q) ||
      ep.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-80 bg-[#14171e]/95 backdrop-blur-xl border-l border-white/[0.08] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-zinc-100 truncate">
            {animeTitle}
          </h3>
          <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
            In-Player Episode Switcher [E]
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Input */}
      <div className="p-2.5 border-b border-white/[0.07]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to episode..."
            className="w-full h-7 pl-8 pr-2.5 rounded bg-[#090a0d] border border-white/[0.07] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Episode List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((ep) => {
          const isCurrent = ep.id === currentEpisodeId;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => onSelectEpisode(ep)}
              className={`w-full p-2.5 rounded-md text-left flex items-center justify-between gap-2.5 border transition-colors ${
                isCurrent
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-[#111317]/80 hover:bg-white/[0.05] border-white/[0.05] text-zinc-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isCurrent ? 'text-indigo-300' : 'text-zinc-200'
                    }`}
                  >
                    EP {String(ep.number).padStart(2, '0')}
                  </span>
                  {ep.completed && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 truncate mt-0.5">
                  {ep.title}
                </p>
              </div>

              <div className="shrink-0 font-mono text-[10px] text-zinc-400 flex items-center gap-1.5">
                <span>{formatTimestamp(ep.durationSec)}</span>
                {isCurrent && (
                  <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
