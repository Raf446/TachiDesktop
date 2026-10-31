import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Play,
  Blocks,
  Tv,
  CornerDownLeft,
  X,
  Star,
} from 'lucide-react';
import {
  AnimeSearchResult,
  NavigationTab,
  StoredExtensionRecord,
} from '../../types/anime';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: AnimeSearchResult[];
  extensions: StoredExtensionRecord[];
  onSelectAnime: (anime: AnimeSearchResult) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onQuickResumeAot: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  catalog,
  extensions,
  onSelectAnime,
  onNavigateTab,
  onQuickResumeAot,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredAnime = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return catalog.slice(0, 5);
    return catalog
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.romajiTitle && a.romajiTitle.toLowerCase().includes(q)) ||
          (a.studio && a.studio.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [catalog, query]);

  const filteredExtensions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return extensions.slice(0, 3);
    return extensions.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.baseUrl.toLowerCase().includes(q) ||
        ext.lang.toLowerCase().includes(q)
    );
  }, [extensions, query]);

  const totalItems = 1 + filteredAnime.length + filteredExtensions.length;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex === 0) {
          onQuickResumeAot();
          onClose();
        } else if (selectedIndex <= filteredAnime.length) {
          const target = filteredAnime[selectedIndex - 1];
          if (target) {
            onSelectAnime(target);
            onClose();
          }
        } else {
          onNavigateTab('extensions');
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    totalItems,
    filteredAnime,
    onClose,
    onQuickResumeAot,
    onSelectAnime,
    onNavigateTab,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#14171e]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input */}
        <div className="flex items-center px-3.5 h-11 border-b border-white/[0.07]">
          <Search className="w-4 h-4 text-zinc-400 mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type an anime title, .js plugin name, or command..."
            className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Action */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Action
            </div>
            <button
              type="button"
              onClick={() => {
                onQuickResumeAot();
                onClose();
              }}
              className={`w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                selectedIndex === 0
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">
                  Resume EP 14: Attack on Titan: The Final Season
                </span>
              </div>
              <span className="font-mono text-[11px] opacity-80">18:24 / 24:00</span>
            </button>
          </div>

          {/* Anime Catalog Matches */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Anime Metadata Catalog ({filteredAnime.length})
            </div>
            <div className="space-y-0.5">
              {filteredAnime.map((anime, idx) => {
                const itemIdx = idx + 1;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <button
                    key={anime.id}
                    type="button"
                    onClick={() => {
                      onSelectAnime(anime);
                      onClose();
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Tv className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <div className="truncate text-left">
                        <span className="font-medium text-zinc-100">{anime.title}</span>
                        {anime.romajiTitle && (
                          <span className="text-zinc-500 ml-2 text-[11px]">
                            {anime.romajiTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      {anime.score && (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {anime.score.toFixed(2)}
                        </span>
                      )}
                      <span className="text-zinc-500">{anime.format || 'TV'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Installed .JS Extensions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Active .JS Extensions ({filteredExtensions.length})
            </div>
            <div className="space-y-0.5">
              {filteredExtensions.map((ext, idx) => {
                const itemIdx = 1 + filteredAnime.length + idx;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => {
                      onNavigateTab('extensions');
                      onClose();
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Blocks className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-mono font-medium">{ext.name}.js</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400">
                        {ext.lang}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-zinc-500 truncate max-w-[180px]">
                        {ext.baseUrl}
                      </span>
                      <span className="text-emerald-400">● {ext.pingMs}ms</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hints */}
        <div className="h-8 px-3.5 bg-[#090a0d] border-t border-white/[0.07] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Open
            </span>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
