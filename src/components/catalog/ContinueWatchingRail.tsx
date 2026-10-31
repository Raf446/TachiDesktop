import React from 'react';
import { Play, Clock } from 'lucide-react';
import { ContinueWatchingItem } from '../../types/anime';
import { formatTimestamp } from '../../services/anilistApi';

interface ContinueWatchingRailProps {
  items: ContinueWatchingItem[];
  onResumeItem: (item: ContinueWatchingItem) => void;
  onOpenAnimeDetail: (animeId: string) => void;
}

export const ContinueWatchingRail: React.FC<ContinueWatchingRailProps> = ({
  items,
  onResumeItem,
  onOpenAnimeDetail,
}) => {
  if (items.length === 0) return null;

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Continue Watching
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            ({items.length})
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Auto-Scrobble @ 80% enabled
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const percent = Math.min(
            100,
            Math.round((item.watchedSec / Math.max(1, item.durationSec)) * 100)
          );

          return (
            <div
              key={`${item.animeId}-${item.episodeNumber}`}
              className="group relative bg-[#14171f] hover:bg-[#181c26] border border-white/[0.07] hover:border-indigo-500/40 rounded-lg p-3 flex items-center gap-3.5 transition-all"
            >
              {/* Poster Thumbnail */}
              <button
                type="button"
                onClick={() => onResumeItem(item)}
                className="relative w-14 h-20 rounded overflow-hidden shrink-0 border border-white/10 bg-[#090a0d]"
              >
                <img
                  src={item.coverUrl}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </button>

              {/* Episode Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    EP {String(item.episodeNumber).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {item.extensionId}.js
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAnimeDetail(item.animeId)}
                  className="block text-left w-full"
                >
                  <h3 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
                    {item.animeTitle}
                  </h3>
                </button>

                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {item.episodeTitle}
                </p>

                {/* Progress & Timestamp */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 mb-1">
                    <span>
                      {formatTimestamp(item.watchedSec)} /{' '}
                      {formatTimestamp(item.durationSec)}
                    </span>
                    <span className="text-indigo-400 font-medium">{percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
