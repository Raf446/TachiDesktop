import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  Star,
  Settings,
  Plus,
  Check,
  Play,
  Bookmark,
  Search,
  ChevronDown,
  Edit3,
  Code2,
  Globe,
} from 'lucide-react';
import {
  AnimeDetail,
  EpisodeItem,
  StoredExtensionRecord,
  TrackerStatus,
} from '../../types/anime';
import { formatTimestamp } from '../../services/anilistApi';

interface AnimeDetailViewProps {
  anime: AnimeDetail;
  extensions: StoredExtensionRecord[];
  selectedExtensionId: string;
  onChangeExtension: (extId: string) => void;
  onBack: () => void;
  onPlayEpisode: (episode: EpisodeItem) => void;
  onToggleLibrary: (animeId: string) => void;
  onUpdateTrackerStatus: (animeId: string, status: TrackerStatus) => void;
  onOpenDomainOverride?: (extension: StoredExtensionRecord) => void;
  onOpenInspectJs?: (extension: StoredExtensionRecord) => void;
}

const TRACKER_STATUS_OPTIONS: TrackerStatus[] = [
  'Watching',
  'Completed',
  'Plan to Watch',
  'On Hold',
  'Dropped',
];

export const AnimeDetailView: React.FC<AnimeDetailViewProps> = ({
  anime,
  extensions,
  selectedExtensionId,
  onChangeExtension,
  onBack,
  onPlayEpisode,
  onToggleLibrary,
  onUpdateTrackerStatus,
  onOpenDomainOverride,
  onOpenInspectJs,
}) => {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [activeEpisodeTab, setActiveEpisodeTab] = useState<'main' | 'special'>('main');
  const [episodeFilter, setEpisodeFilter] = useState('');
  const [showTrackerMenu, setShowTrackerMenu] = useState(false);
  const [showPluginGearMenu, setShowPluginGearMenu] = useState(false);

  const activeExtension = useMemo(() => {
    return (
      extensions.find((ext) => ext.id === selectedExtensionId) ||
      extensions[0] || {
        id: 'otakudesu',
        name: 'Otakudesu',
        version: '1.4.2',
        lang: 'id' as const,
        baseUrl: 'https://otakudesu.cloud',
        defaultBaseUrl: 'https://otakudesu.cloud',
        sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/otakudesu',
        generatedJsCode: '',
        pingMs: 42,
        updatedAt: 'Today',
      }
    );
  }, [extensions, selectedExtensionId]);

  const resumeEpisode = useMemo(() => {
    const inProgress = anime.episodes.find(
      (ep) => !ep.completed && ep.watchedSec > 0
    );
    if (inProgress) return inProgress;
    const firstUnwatched = anime.episodes.find((ep) => !ep.completed);
    return firstUnwatched || anime.episodes[0];
  }, [anime.episodes]);

  const completedCount = useMemo(
    () => anime.episodes.filter((ep) => ep.completed).length,
    [anime.episodes]
  );

  const filteredEpisodes = useMemo(() => {
    const sourceList =
      activeEpisodeTab === 'main' ? anime.episodes : anime.specialEpisodes;
    if (!episodeFilter.trim()) return sourceList;
    const q = episodeFilter.toLowerCase().trim();
    return sourceList.filter(
      (ep) =>
        String(ep.number).includes(q) ||
        `ep ${ep.number}`.includes(q) ||
        ep.title.toLowerCase().includes(q)
    );
  }, [anime.episodes, anime.specialEpisodes, activeEpisodeTab, episodeFilter]);

  return (
    <div className="h-full overflow-y-auto bg-[#090a0d] px-6 py-5">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-7">
        {/* A. KOLOM KIRI (30% Lebar — Poster, Ekstensi & Metadata) */}
        <div className="w-full lg:w-[30%] shrink-0 space-y-4">
          {/* 1. Navigasi Atas */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* 2. Poster Vertikal HD (Rasio 2:3) + Floating Badges Kiri Atas */}
          <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-white/10 bg-[#14171f]">
            <img
              src={anime.coverUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2 py-1 rounded-md bg-[#090a0d]/85 backdrop-blur-md border border-white/10 font-mono text-xs font-semibold text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {anime.score.toFixed(2)}
              </span>
              <span className="px-2 py-1 rounded-md bg-[#090a0d]/85 backdrop-blur-md border border-white/10 text-xs font-medium text-zinc-100">
                {anime.status}
              </span>
            </div>
          </div>

          {/* 3. Info Ringkas */}
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 px-0.5">
            <span>{anime.format}</span>
            <span>•</span>
            <span className="text-zinc-200">{anime.studio}</span>
            <span>•</span>
            <span>{anime.totalEpisodes} Episodes</span>
          </div>

          {/* 4. Dropdown Sumber Ekstensi (.js) + Tombol Gerigi (⚙) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Active Scraper Extension (.JS)
            </label>
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <select
                  value={activeExtension.id}
                  onChange={(e) => onChangeExtension(e.target.value)}
                  aria-label="Select .JS extension source"
                  className="w-full h-9 pl-3 pr-8 rounded-md bg-[#14171f] hover:bg-[#181c26] border border-white/[0.07] focus:border-indigo-500 text-xs font-mono text-zinc-200 appearance-none cursor-pointer focus:outline-none transition-colors"
                >
                  {extensions.map((ext) => (
                    <option
                      key={ext.id}
                      value={ext.id}
                      className="bg-[#111317] text-zinc-200 font-mono"
                    >
                      {ext.name}.js ({ext.lang.toUpperCase()}) ● {ext.pingMs}ms
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </div>

              {/* Tombol Gerigi Quick Access */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPluginGearMenu((prev) => !prev)}
                  title="Extension Quick Settings (Domain Override / Inspect .JS)"
                  className="w-9 h-9 rounded-md bg-[#14171f] hover:bg-[#1c202b] border border-white/[0.07] flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showPluginGearMenu && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-md bg-[#14171e]/95 backdrop-blur-xl border border-white/[0.09] shadow-xl py-1 z-30">
                    <div className="px-3 py-1.5 border-b border-white/[0.06] font-mono text-[10px] text-zinc-400 truncate">
                      {activeExtension.name}.js • {activeExtension.baseUrl}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPluginGearMenu(false);
                        onOpenDomainOverride?.(activeExtension);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-indigo-600/20 flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Domain Override (ISP Bypass)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPluginGearMenu(false);
                        onOpenInspectJs?.(activeExtension);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-indigo-600/20 flex items-center gap-2"
                    >
                      <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspect / Edit .JS Code</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Tombol Koleksi (+ Add to Library) */}
          <button
            type="button"
            onClick={() => onToggleLibrary(anime.id)}
            className={`w-full h-9 rounded-md font-medium text-xs flex items-center justify-center gap-2 border transition-colors ${
              anime.inLibrary
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-[#161920] hover:bg-[#1d212b] border-white/[0.08] text-zinc-100'
            }`}
          >
            {anime.inLibrary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>In Library (Saved)</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add to Library</span>
              </>
            )}
          </button>

          {/* 6. Tag Genre */}
          <div className="pt-1">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
              Genres
            </span>
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-1 rounded bg-[#14171f] border border-white/[0.07] text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* B. KOLOM KANAN (70% Lebar — Header, Action Bar & Grid Episode) */}
        <div className="w-full lg:w-[70%] space-y-5">
          {/* 1. Header Judul */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {anime.title}
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5 font-medium">
              {anime.romajiTitle}
            </p>
          </div>

          {/* 2. Sinopsis */}
          <div className="bg-[#111317] border border-white/[0.07] rounded-lg p-3.5">
            <p
              className={`text-xs leading-relaxed text-zinc-300 ${
                synopsisExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {anime.synopsis}
            </p>
            <button
              type="button"
              onClick={() => setSynopsisExpanded((prev) => !prev)}
              className="mt-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {synopsisExpanded ? 'show less' : 'read more'}
            </button>
          </div>

          {/* 3. Dual Action Bar (Tombol Utama) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Tombol Kiri: Primary Indigo CTA */}
            {resumeEpisode && (
              <button
                type="button"
                onClick={() => onPlayEpisode(resumeEpisode)}
                className="flex-1 px-4 py-3 rounded-lg bg-[#4f46e5] hover:bg-[#6366f1] text-white flex items-center gap-3.5 transition-colors border border-indigo-400/30 text-left"
              >
                <div className="w-9 h-9 rounded-md bg-black/25 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold tracking-tight">
                    Resume EP {String(resumeEpisode.number).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-indigo-100/90 truncate font-mono mt-0.5">
                    {resumeEpisode.title} • {formatTimestamp(resumeEpisode.watchedSec)} /{' '}
                    {formatTimestamp(resumeEpisode.durationSec)}
                  </div>
                </div>
              </button>
            )}

            {/* Tombol Kanan: Tracker Control & Bookmark */}
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTrackerMenu((prev) => !prev)}
                  className="h-[58px] px-4 rounded-lg bg-[#14171f] hover:bg-[#191d28] border border-white/[0.07] text-left flex items-center gap-3 transition-colors"
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span>MyAnimeList Sync</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-xs font-semibold text-zinc-100 mt-0.5 flex items-center gap-1.5">
                      <span>
                        Track Status: {anime.trackerStatus} ({completedCount}/
                        {anime.totalEpisodes})
                      </span>
                      <Edit3 className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                </button>

                {showTrackerMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-md bg-[#14171e]/95 backdrop-blur-xl border border-white/[0.09] shadow-xl py-1 z-30">
                    {TRACKER_STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          onUpdateTrackerStatus(anime.id, st);
                          setShowTrackerMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
                          anime.trackerStatus === st
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                            : 'text-zinc-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{st}</span>
                        {anime.trackerStatus === st && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleLibrary(anime.id)}
                title={anime.inLibrary ? 'Remove Bookmark' : 'Bookmark Anime'}
                className={`w-[58px] h-[58px] rounded-lg border flex items-center justify-center transition-colors ${
                  anime.inLibrary
                    ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-400'
                    : 'bg-[#14171f] hover:bg-[#191d28] border-white/[0.07] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${anime.inLibrary ? 'fill-indigo-400' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* 4. Sub-Header Episode (Tabs & Filter) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-white/[0.07] pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveEpisodeTab('main')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeEpisodeTab === 'main'
                    ? 'bg-[#161920] text-white border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Season 4 ({anime.episodes.length} Episodes)
              </button>
              <button
                type="button"
                onClick={() => setActiveEpisodeTab('special')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeEpisodeTab === 'special'
                    ? 'bg-[#161920] text-white border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Special Episodes ({anime.specialEpisodes.length})
              </button>
            </div>

            <div className="relative w-52">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={episodeFilter}
                onChange={(e) => setEpisodeFilter(e.target.value)}
                placeholder="Filter episodes..."
                className="w-full h-8 pl-8 pr-3 rounded-md bg-[#111317] border border-white/[0.07] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 5. Interactive 4-Column Episode Grid */}
          {filteredEpisodes.length === 0 ? (
            <div className="py-10 text-center bg-[#111317] rounded-lg border border-white/[0.07] text-xs text-zinc-400">
              No episodes match "{episodeFilter}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-10">
              {filteredEpisodes.map((ep) => {
                const isCompleted = ep.completed;
                const isWatching = !ep.completed && ep.watchedSec > 0;
                const progressPercent = isWatching
                  ? Math.min(
                      99,
                      Math.round((ep.watchedSec / Math.max(1, ep.durationSec)) * 100)
                    )
                  : 0;

                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => onPlayEpisode(ep)}
                    className={`group relative rounded-lg p-3 text-left transition-all flex flex-col justify-between min-h-[82px] border ${
                      isWatching
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : isCompleted
                          ? 'bg-[#12151c] border-white/[0.06] hover:border-emerald-500/40'
                          : 'bg-[#14171f] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    {/* Top Row: Monospace EP Number + Status Indicator */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isWatching
                            ? 'text-indigo-300'
                            : isCompleted
                              ? 'text-zinc-300'
                              : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        EP {String(ep.number).padStart(2, '0')}
                      </span>

                      {isCompleted && (
                        <span
                          title="Completed (Synced)"
                          className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold"
                        >
                          ✓
                        </span>
                      )}

                      {isWatching && (
                        <span className="font-mono text-[10px] font-semibold text-indigo-300">
                          {progressPercent}%
                        </span>
                      )}
                    </div>

                    {/* Episode Title */}
                    <p
                      className={`text-xs line-clamp-1 mt-1.5 ${
                        isWatching
                          ? 'text-white font-medium'
                          : isCompleted
                            ? 'text-zinc-400'
                            : 'text-zinc-300'
                      }`}
                    >
                      {ep.title}
                    </p>

                    {/* Bottom Mini Progress Bar for Active Episode or Timestamp */}
                    {isWatching ? (
                      <div className="w-full mt-2">
                        <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                        <span>{formatTimestamp(ep.durationSec)}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity">
                          Play ▶
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
