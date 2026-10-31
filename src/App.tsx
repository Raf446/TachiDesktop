import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimeDetail,
  AnimeSearchResult,
  ContinueWatchingItem,
  DiscordRpcState,
  EpisodeItem,
  NavigationTab,
  StoredExtensionRecord,
  TrackerAccountConfig,
  TrackerStatus,
} from './types/anime';
import {
  FALLBACK_ANIME_DETAILS,
  fetchAniListTrending,
  getAnimeDetailById,
  getFallbackCatalogList,
  INITIAL_CONTINUE_WATCHING,
} from './services/anilistApi';
import {
  clearDiscordActivity,
  getDiscordRpcStatus,
  setDiscordRpcEnabled,
  updateDiscordActivity,
} from './services/discordRpc';
import {
  fetchTrackerConfig,
  scrobbleEpisodeProgress,
} from './services/trackerSync';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { CatalogView } from './components/catalog/CatalogView';
import { AnimeDetailView } from './components/catalog/AnimeDetailView';
import { TheaterPlayer } from './components/player/TheaterPlayer';

const INITIAL_EXTENSIONS: StoredExtensionRecord[] = [
  {
    id: 'otakudesu',
    name: 'Otakudesu',
    version: '1.4.2',
    lang: 'id',
    baseUrl: 'https://otakudesu.cloud',
    defaultBaseUrl: 'https://otakudesu.cloud',
    sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/otakudesu',
    generatedJsCode: '// Compiled TachiDesktop .JS Plugin: Otakudesu (ID)',
    pingMs: 42,
    hasUpdate: false,
    isBuiltin: true,
    updatedAt: '2026-10-31',
  },
  {
    id: 'samehadaku',
    name: 'Samehadaku',
    version: '1.3.8',
    lang: 'id',
    baseUrl: 'https://samehadaku.email',
    defaultBaseUrl: 'https://samehadaku.email',
    sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/samehadaku',
    generatedJsCode: '// Compiled TachiDesktop .JS Plugin: Samehadaku (ID)',
    pingMs: 58,
    hasUpdate: true,
    isBuiltin: true,
    updatedAt: '2026-10-30',
  },
  {
    id: 'kuramanime',
    name: 'Kuramanime',
    version: '2.1.0',
    lang: 'id',
    baseUrl: 'https://kuramanime.red',
    defaultBaseUrl: 'https://kuramanime.red',
    sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/kuramanime',
    generatedJsCode: '// Compiled TachiDesktop .JS Plugin: Kuramanime (ID)',
    pingMs: 64,
    hasUpdate: false,
    isBuiltin: true,
    updatedAt: '2026-10-29',
  },
  {
    id: 'hianime',
    name: 'HiAnime',
    version: '3.0.4',
    lang: 'en',
    baseUrl: 'https://hianime.to',
    defaultBaseUrl: 'https://hianime.to',
    sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/en/hianime',
    generatedJsCode: '// Compiled TachiDesktop .JS Plugin: HiAnime (EN)',
    pingMs: 85,
    hasUpdate: true,
    isBuiltin: true,
    updatedAt: '2026-10-28',
  },
  {
    id: 'anoboy',
    name: 'Anoboy',
    version: '1.1.9',
    lang: 'id',
    baseUrl: 'https://anoboy.baby',
    defaultBaseUrl: 'https://anoboy.baby',
    sourceRepoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/anoboy',
    generatedJsCode: '// Compiled TachiDesktop .JS Plugin: Anoboy (ID)',
    pingMs: 71,
    hasUpdate: false,
    isBuiltin: true,
    updatedAt: '2026-10-25',
  },
];

type ActiveScreen = 'catalog' | 'detail' | 'player';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('browse');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('catalog');

  const [catalog, setCatalog] = useState<AnimeSearchResult[]>(getFallbackCatalogList);
  const [animeDetailsMap, setAnimeDetailsMap] =
    useState<Record<string, AnimeDetail>>(FALLBACK_ANIME_DETAILS);
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>('aot-final');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('aot-s4-ep-14');

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(
    INITIAL_CONTINUE_WATCHING
  );
  const [extensions, setExtensions] =
    useState<StoredExtensionRecord[]>(INITIAL_EXTENSIONS);
  const [selectedExtensionId, setSelectedExtensionId] = useState<string>('otakudesu');

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [discordStatus, setDiscordStatus] = useState<DiscordRpcState>({
    enabled: true,
    ipcConnected: true,
    statusMessage: 'Discord RPC Active',
  });

  const [trackerConfig, setTrackerConfig] = useState<TrackerAccountConfig>({
    malConnected: true,
    malUsername: 'Raf',
    anilistConnected: false,
    anilistUsername: '',
    autoScrobbleEnabled: true,
    autoScrobbleThreshold: 80,
  });

  // Load initial Discord RPC & Tracker config
  useEffect(() => {
    getDiscordRpcStatus().then(setDiscordStatus);
    fetchTrackerConfig().then(setTrackerConfig);
  }, []);

  // Global keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const currentAnimeDetail = useMemo(() => {
    return (
      animeDetailsMap[selectedAnimeId] ||
      getAnimeDetailById(selectedAnimeId)
    );
  }, [animeDetailsMap, selectedAnimeId]);

  const currentEpisode = useMemo(() => {
    const allEps = [
      ...currentAnimeDetail.episodes,
      ...currentAnimeDetail.specialEpisodes,
    ];
    return (
      allEps.find((ep) => ep.id === activeEpisodeId) ||
      currentAnimeDetail.episodes[13] ||
      currentAnimeDetail.episodes[0]
    );
  }, [currentAnimeDetail, activeEpisodeId]);

  const activeExtension = useMemo(() => {
    return (
      extensions.find((ext) => ext.id === selectedExtensionId) ||
      extensions[0]
    );
  }, [extensions, selectedExtensionId]);

  // Sync Discord Rich Presence whenever screen or active episode changes
  useEffect(() => {
    if (!discordStatus.enabled) return;

    if (activeScreen === 'player' && currentEpisode) {
      updateDiscordActivity({
        animeTitle: currentAnimeDetail.title,
        episodeNumber: currentEpisode.number,
        episodeTitle: currentEpisode.title,
        currentTimeSec: currentEpisode.watchedSec,
        durationSec: currentEpisode.durationSec,
        posterUrl: currentAnimeDetail.coverUrl,
        sourceName: `${activeExtension.name}.js`,
        isPaused: false,
      }).then(setDiscordStatus);
    } else {
      clearDiscordActivity().then(setDiscordStatus);
    }
  }, [
    activeScreen,
    currentAnimeDetail.title,
    currentAnimeDetail.coverUrl,
    currentEpisode,
    activeExtension.name,
    discordStatus.enabled,
  ]);

  const handleRefreshCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const results = await fetchAniListTrending(searchQuery);
      setCatalog(results);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [searchQuery]);

  const handleOpenAnime = useCallback(
    (animeOrId: string | AnimeSearchResult) => {
      const id = typeof animeOrId === 'string' ? animeOrId : animeOrId.id;
      if (!animeDetailsMap[id]) {
        const detail = getAnimeDetailById(animeOrId);
        setAnimeDetailsMap((prev) => ({ ...prev, [id]: detail }));
        setSelectedExtensionId(detail.activeExtensionId || 'otakudesu');
      } else {
        setSelectedExtensionId(animeDetailsMap[id].activeExtensionId || 'otakudesu');
      }
      setSelectedAnimeId(id);
      setActiveScreen('detail');
    },
    [animeDetailsMap]
  );

  const handlePlayEpisode = useCallback(
    (episode: EpisodeItem) => {
      setActiveEpisodeId(episode.id);
      setActiveScreen('player');
    },
    []
  );

  const handleResumeWatchingItem = useCallback(
    (item: ContinueWatchingItem) => {
      setSelectedAnimeId(item.animeId);
      setSelectedExtensionId(item.extensionId);
      setActiveEpisodeId(item.episodeId);
      setActiveScreen('player');
    },
    []
  );

  const handleToggleLibrary = useCallback((animeId: string) => {
    setAnimeDetailsMap((prev) => {
      const current = prev[animeId] || getAnimeDetailById(animeId);
      const nextInLib = !current.inLibrary;
      return {
        ...prev,
        [animeId]: {
          ...current,
          inLibrary: nextInLib,
        },
      };
    });
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === animeId ? { ...item, inLibrary: !item.inLibrary } : item
      )
    );
  }, []);

  const handleUpdateTrackerStatus = useCallback(
    (animeId: string, status: TrackerStatus) => {
      setAnimeDetailsMap((prev) => {
        const current = prev[animeId] || getAnimeDetailById(animeId);
        return {
          ...prev,
          [animeId]: {
            ...current,
            trackerStatus: status,
          },
        };
      });
    },
    []
  );

  const handlePlayerProgressUpdate = useCallback(
    (episodeId: string, watchedSec: number, durationSec: number) => {
      setAnimeDetailsMap((prev) => {
        const current = prev[selectedAnimeId];
        if (!current) return prev;
        return {
          ...prev,
          [selectedAnimeId]: {
            ...current,
            episodes: current.episodes.map((ep) =>
              ep.id === episodeId ? { ...ep, watchedSec, durationSec } : ep
            ),
          },
        };
      });

      setContinueWatching((prev) => {
        const ep = currentAnimeDetail.episodes.find((e) => e.id === episodeId);
        if (!ep) return prev;
        const updatedItem: ContinueWatchingItem = {
          animeId: currentAnimeDetail.id,
          animeTitle: currentAnimeDetail.title,
          romajiTitle: currentAnimeDetail.romajiTitle,
          coverUrl: currentAnimeDetail.coverUrl,
          episodeId: ep.id,
          episodeNumber: ep.number,
          episodeTitle: ep.title,
          watchedSec,
          durationSec,
          extensionId: selectedExtensionId,
          updatedAt: 'Just now',
        };
        const rest = prev.filter((item) => item.animeId !== currentAnimeDetail.id);
        return [updatedItem, ...rest];
      });
    },
    [selectedAnimeId, currentAnimeDetail, selectedExtensionId]
  );

  const handleAutoScrobbleTriggered = useCallback(
    async (episode: EpisodeItem) => {
      setAnimeDetailsMap((prev) => {
        const current = prev[selectedAnimeId];
        if (!current) return prev;
        const updatedEpisodes = current.episodes.map((ep) =>
          ep.id === episode.id ? { ...ep, completed: true } : ep
        );
        const completedCount = updatedEpisodes.filter((e) => e.completed).length;
        return {
          ...prev,
          [selectedAnimeId]: {
            ...current,
            trackedProgress: completedCount,
            episodes: updatedEpisodes,
          },
        };
      });

      await scrobbleEpisodeProgress({
        animeId: currentAnimeDetail.id,
        malId: currentAnimeDetail.malId,
        animeTitle: currentAnimeDetail.title,
        episodeNumber: episode.number,
        totalEpisodes: currentAnimeDetail.totalEpisodes,
      });
    },
    [selectedAnimeId, currentAnimeDetail]
  );

  const handleToggleDiscordQuick = useCallback(async () => {
    const next = !discordStatus.enabled;
    const status = await setDiscordRpcEnabled(next);
    setDiscordStatus(status);
  }, [discordStatus.enabled]);

  const libraryCount = useMemo(
    () => catalog.filter((item) => item.inLibrary).length,
    [catalog]
  );

  const extensionUpdateCount = useMemo(
    () => extensions.filter((ext) => ext.hasUpdate).length,
    [extensions]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090a0d] text-zinc-100 overflow-hidden select-none">
      {/* Custom Desktop Titlebar (Hidden when in fullscreen video theater) */}
      {activeScreen !== 'player' && (
        <Titlebar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (activeScreen !== 'catalog') {
              setActiveScreen('catalog');
            }
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          discordStatus={discordStatus}
          onToggleDiscordQuick={handleToggleDiscordQuick}
          trackerConfig={trackerConfig}
          onNavigateSettings={() => {
            setActiveTab('settings');
            setActiveScreen('catalog');
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeScreen !== 'player' && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setActiveScreen('catalog');
            }}
            extensionUpdateCount={extensionUpdateCount}
            libraryCount={libraryCount}
            hasActiveSession
            onResumePlayer={() => {
              setSelectedAnimeId('aot-final');
              setActiveEpisodeId('aot-s4-ep-14');
              setActiveScreen('player');
            }}
          />
        )}

        <main className="flex-1 min-w-0 h-full overflow-hidden relative">
          {activeScreen === 'player' ? (
            <TheaterPlayer
              anime={currentAnimeDetail}
              episode={currentEpisode}
              activeExtension={activeExtension}
              autoScrobbleThreshold={trackerConfig.autoScrobbleThreshold}
              onBackToDetail={(lastSec) => {
                handlePlayerProgressUpdate(
                  currentEpisode.id,
                  lastSec,
                  currentEpisode.durationSec
                );
                setActiveScreen('detail');
              }}
              onSelectEpisode={(nextEp) => {
                setActiveEpisodeId(nextEp.id);
              }}
              onProgressUpdate={handlePlayerProgressUpdate}
              onAutoScrobbleTriggered={handleAutoScrobbleTriggered}
            />
          ) : activeScreen === 'detail' ? (
            <AnimeDetailView
              anime={currentAnimeDetail}
              extensions={extensions}
              selectedExtensionId={selectedExtensionId}
              onChangeExtension={(extId) => setSelectedExtensionId(extId)}
              onBack={() => setActiveScreen('catalog')}
              onPlayEpisode={handlePlayEpisode}
              onToggleLibrary={handleToggleLibrary}
              onUpdateTrackerStatus={handleUpdateTrackerStatus}
              onOpenDomainOverride={() => {
                setActiveTab('extensions');
                setActiveScreen('catalog');
              }}
              onOpenInspectJs={() => {
                setActiveTab('extensions');
                setActiveScreen('catalog');
              }}
            />
          ) : (
            <CatalogView
              activeTab={activeTab}
              catalog={catalog}
              continueWatching={continueWatching}
              isLoading={isLoadingCatalog}
              searchQuery={searchQuery}
              onRefreshCatalog={handleRefreshCatalog}
              onSelectAnime={handleOpenAnime}
              onResumeWatching={handleResumeWatchingItem}
              onOpenAnimeById={handleOpenAnime}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        catalog={catalog}
        extensions={extensions}
        onSelectAnime={handleOpenAnime}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setActiveScreen('catalog');
        }}
        onQuickResumeAot={() => {
          setSelectedAnimeId('aot-final');
          setActiveEpisodeId('aot-s4-ep-14');
          setActiveScreen('player');
        }}
      />
    </div>
  );
};

export default App;
