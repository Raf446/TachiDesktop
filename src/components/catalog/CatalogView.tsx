import React, { useMemo, useState } from 'react';
import {
  Star,
  RefreshCw,
  Check,
  Filter,
  Sparkles,
  BookmarkCheck,
} from 'lucide-react';
import {
  AnimeSearchResult,
  ContinueWatchingItem,
  NavigationTab,
} from '../../types/anime';
import { ContinueWatchingRail } from './ContinueWatchingRail';

interface CatalogViewProps {
  activeTab: NavigationTab;
  catalog: AnimeSearchResult[];
  continueWatching: ContinueWatchingItem[];
  isLoading: boolean;
  searchQuery: string;
  onRefreshCatalog: () => void;
  onSelectAnime: (anime: AnimeSearchResult) => void;
  onResumeWatching: (item: ContinueWatchingItem) => void;
  onOpenAnimeById: (animeId: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  activeTab,
  catalog,
  continueWatching,
  isLoading,
  searchQuery,
  onRefreshCatalog,
  onSelectAnime,
  onResumeWatching,
  onOpenAnimeById,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Ongoing' | 'Completed'>('ALL');

  const displayedAnime = useMemo(() => {
    let list = [...catalog];

    if (activeTab === 'library') {
      list = list.filter((item) => item.inLibrary);
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.romajiTitle && item.romajiTitle.toLowerCase().includes(q)) ||
          (item.studio && item.studio.toLowerCase().includes(q))
      );
    }

    return list;
  }, [catalog, activeTab, statusFilter, searchQuery]);

  const sectionTitle =
    activeTab === 'library'
      ? 'Personal Library'
      : activeTab === 'history'
        ? 'Watch History & Scrobble Queue'
        : searchQuery.trim()
          ? `Search Results for "${searchQuery}"`
          : 'Trending & Top Rated Metadata (AniList Clean Shell)';

  return (
    <div className="h-full overflow-y-auto px-6 py-5 bg-[#090a0d]">
      {/* Continue Watching Rail */}
      {(activeTab === 'browse' || activeTab === 'library' || activeTab === 'history') &&
        !searchQuery.trim() && (
          <ContinueWatchingRail
            items={continueWatching}
            onResumeItem={onResumeWatching}
            onOpenAnimeDetail={onOpenAnimeById}
          />
        )}

      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {sectionTitle}
          </h1>
          <span className="font-mono text-xs text-zinc-500">
            ({displayedAnime.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#111317] p-0.5 rounded-md border border-white/[0.07]">
            <Filter className="w-3 h-3 text-zinc-500 ml-2 mr-1" />
            {(['ALL', 'Ongoing', 'Completed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefreshCatalog}
            disabled={isLoading}
            className="h-7 px-2.5 rounded-md bg-[#14171f] hover:bg-[#1a1e29] border border-white/[0.07] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync AniList</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {displayedAnime.length === 0 ? (
        <div className="py-16 text-center bg-[#111317]/60 rounded-lg border border-white/[0.07]">
          <p className="text-sm font-medium text-zinc-300">
            No matching anime found in {activeTab}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Try clearing the status filter or searching another title in the command bar.
          </p>
          {statusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="mt-3 px-3 py-1.5 rounded bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        /* 2:3 Poster Card Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">
          {displayedAnime.map((anime) => (
            <button
              key={anime.id}
              type="button"
              onClick={() => onSelectAnime(anime)}
              className="group text-left flex flex-col focus:outline-none"
            >
              <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#14171f] border border-white/[0.08] group-hover:border-indigo-500/60 transition-all">
                <img
                  src={anime.coverUrl}
                  alt={anime.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />

                {/* Top-Left Floating Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {anime.score && (
                    <span className="px-1.5 py-0.5 rounded bg-[#090a0d]/85 backdrop-blur-md border border-white/10 font-mono text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {anime.score.toFixed(2)}
                    </span>
                  )}
                  {anime.status && (
                    <span
                      className={`px-1.5 py-0.5 rounded bg-[#090a0d]/85 backdrop-blur-md border border-white/10 text-[10px] font-medium ${
                        anime.status === 'Ongoing'
                          ? 'text-emerald-400'
                          : 'text-zinc-300'
                      }`}
                    >
                      {anime.status}
                    </span>
                  )}
                </div>

                {/* Top-Right In Library Indicator */}
                {anime.inLibrary && (
                  <div
                    title="Saved in Library"
                    className="absolute top-2 right-2 w-6 h-6 rounded bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 flex items-center justify-center text-white"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Bottom Gradient Overlay with Studio & Episode Count */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/80 to-transparent pt-8 pb-2 px-2.5 flex items-center justify-between font-mono text-[10px] text-zinc-300">
                  <span>{anime.format || 'TV'}</span>
                  <span>
                    {anime.watchedEpisodes !== undefined && anime.watchedEpisodes > 0
                      ? `${anime.watchedEpisodes}/${anime.episodes || '?'} EP`
                      : `${anime.episodes || '?'} EP`}
                  </span>
                </div>
              </div>

              <h3 className="mt-2 text-xs font-semibold text-zinc-100 group-hover:text-indigo-400 line-clamp-1 transition-colors">
                {anime.title}
              </h3>
              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                {anime.studio || anime.romajiTitle || 'Studio MAPPA'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
