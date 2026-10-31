import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimeDetail,
  AnimeSearchResult,
  ContinueWatchingItem,
  DiscordRpcState,
  EpisodeItem,
  NavigationTab,
  StoredExtensionRecord,
  StreamSource,
  TrackerAccountConfig,
  TrackerStatus,
  TrackerSyncEvent,
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
  fetchScrobbleHistory,
  fetchTrackerConfig,
  saveTrackerConfig,
  scrobbleEpisodeProgress,
} from './services/trackerSync';
import { buildDefaultCompiledExtensions } from './services/repoCompiler';
import {
  initializeGlobalPluginBridge,
  loadInstalledPlugins,
  overridePluginBaseUrl,
  removeInstalledPlugin,
  resolveStreamsFromPlugin,
  saveAndMountPlugin,
} from './services/pluginRuntime';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { CatalogView } from './components/catalog/CatalogView';
import { AnimeDetailView } from './components/catalog/AnimeDetailView';
import { TheaterPlayer } from './components/player/TheaterPlayer';
import { ExtensionManager } from './components/extensions/ExtensionManager';
import { JsCodeInspectorModal } from './components/extensions/JsCodeInspectorModal';
import { DomainOverrideModal } from './components/extensions/DomainOverrideModal';
import { SettingsView } from './components/settings/SettingsView';

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
  const [extensions, setExtensions] = useState<StoredExtensionRecord[]>(
    buildDefaultCompiledExtensions
  );
  const [selectedExtensionId, setSelectedExtensionId] = useState<string>('otakudesu');
  const [resolvedStreams, setResolvedStreams] = useState<StreamSource[] | undefined>(
    undefined
  );

  const [inspectModalPlugin, setInspectModalPlugin] =
    useState<StoredExtensionRecord | null>(null);
  const [domainModalPlugin, setDomainModalPlugin] =
    useState<StoredExtensionRecord | null>(null);

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

  const [scrobbleHistory, setScrobbleHistory] = useState<TrackerSyncEvent[]>([
    {
      animeId: 'aot-final',
      malId: 40028,
      animeTitle: 'Attack on Titan: The Final Season',
      episodeNumber: 13,
      totalEpisodes: 28,
      status: 'Watching',
      syncedAt: 'Yesterday',
      provider: 'MyAnimeList',
    },
  ]);

  // Initialize bridge, plugins, Discord RPC status & tracker state
  useEffect(() => {
    initializeGlobalPluginBridge();
    loadInstalledPlugins().then((list) => {
      if (list.length > 0) {
        setExtensions(list);
      }
    });
    getDiscordRpcStatus().then(setDiscordStatus);
    fetchTrackerConfig().then(setTrackerConfig);
    fetchScrobbleHistory().then((hist) => {
      if (hist.length > 0) {
        setScrobbleHistory(hist);
      }
    });
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

  // Resolve streams from active .JS plugin when entering player
  useEffect(() => {
    if (activeScreen !== 'player' || !activeExtension || !currentEpisode) return;
    let cancelled = false;
    resolveStreamsFromPlugin(activeExtension, currentEpisode.url).then((streams) => {
      if (!cancelled) {
        setResolvedStreams(streams.length > 0 ? streams : undefined);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeScreen, activeExtension, currentEpisode]);

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

  const handlePlayEpisode = useCallback((episode: EpisodeItem) => {
    setActiveEpisodeId(episode.id);
    setActiveScreen('player');
  }, []);

  const handleResumeWatchingItem = useCallback((item: ContinueWatchingItem) => {
    setSelectedAnimeId(item.animeId);
    setSelectedExtensionId(item.extensionId);
    setActiveEpisodeId(item.episodeId);
    setActiveScreen('player');
  }, []);

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
      if (!trackerConfig.autoScrobbleEnabled) return;

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

      const event = await scrobbleEpisodeProgress({
        animeId: currentAnimeDetail.id,
        malId: currentAnimeDetail.malId,
        animeTitle: currentAnimeDetail.title,
        episodeNumber: episode.number,
        totalEpisodes: currentAnimeDetail.totalEpisodes,
      });

      setScrobbleHistory((prev) => [
        event,
        ...prev.filter(
          (i) =>
            !(
              i.animeId === event.animeId &&
              i.episodeNumber === event.episodeNumber
            )
        ),
      ]);
    },
    [selectedAnimeId, currentAnimeDetail, trackerConfig.autoScrobbleEnabled]
  );

  const handleSetDiscordEnabled = useCallback(async (enabled: boolean) => {
    const status = await setDiscordRpcEnabled(enabled);
    setDiscordStatus(status);
  }, []);

  const handleInstallOrUpdatePlugin = useCallback(
    async (plugin: StoredExtensionRecord) => {
      const saved = await saveAndMountPlugin(plugin);
      setExtensions((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        if (exists) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...prev];
      });
      setSelectedExtensionId(saved.id);
    },
    []
  );

  const handleApplyDomainOverride = useCallback(
    async (id: string, newBaseUrl: string, newPingMs?: number) => {
      const nextList = await overridePluginBaseUrl(id, newBaseUrl, extensions);
      setExtensions(
        nextList.map((item) =>
          item.id === id && newPingMs !== undefined
            ? { ...item, pingMs: newPingMs }
            : item
        )
      );
    },
    [extensions]
  );

  const handleDeletePlugin = useCallback(
    async (id: string) => {
      const nextList = await removeInstalledPlugin(id, extensions);
      setExtensions(nextList);
      if (selectedExtensionId === id && nextList[0]) {
        setSelectedExtensionId(nextList[0].id);
      }
    },
    [extensions, selectedExtensionId]
  );

  const handleUpdatePluginPing = useCallback((id: string, pingMs: number) => {
    setExtensions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pingMs } : item))
    );
  }, []);

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
            if (activeScreen !== 'catalog' || activeTab === 'extensions' || activeTab === 'settings') {
              setActiveTab('browse');
              setActiveScreen('catalog');
            }
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          discordStatus={discordStatus}
          onToggleDiscordQuick={() => handleSetDiscordEnabled(!discordStatus.enabled)}
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
              customStreams={resolvedStreams}
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
              onOpenDomainOverride={(ext) => setDomainModalPlugin(ext)}
              onOpenInspectJs={(ext) => setInspectModalPlugin(ext)}
            />
          ) : activeTab === 'extensions' ? (
            <ExtensionManager
              extensions={extensions}
              activeExtensionId={selectedExtensionId}
              onSelectActiveExtension={(id) => setSelectedExtensionId(id)}
              onInstallCompiledPlugin={handleInstallOrUpdatePlugin}
              onOpenInspectModal={(ext) => setInspectModalPlugin(ext)}
              onOpenDomainModal={(ext) => setDomainModalPlugin(ext)}
              onDeletePlugin={handleDeletePlugin}
              onUpdatePing={handleUpdatePluginPing}
            />
          ) : activeTab === 'settings' ? (
            <SettingsView
              discordStatus={discordStatus}
              onToggleDiscordRpc={handleSetDiscordEnabled}
              trackerConfig={trackerConfig}
              onSaveTrackerConfig={async (nextCfg) => {
                const saved = await saveTrackerConfig(nextCfg);
                setTrackerConfig(saved);
              }}
              scrobbleHistory={scrobbleHistory}
              onTriggerTestScrobble={async () => {
                const ep14 =
                  currentAnimeDetail.episodes.find((e) => e.number === 14) ||
                  currentAnimeDetail.episodes[0];
                if (ep14) {
                  await handleAutoScrobbleTriggered(ep14);
                }
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

      {/* Inspect / Edit .JS Code Modal */}
      <JsCodeInspectorModal
        extension={inspectModalPlugin}
        onClose={() => setInspectModalPlugin(null)}
        onSaveAndHotReload={async (updated) => {
          await handleInstallOrUpdatePlugin(updated);
          setInspectModalPlugin(updated);
        }}
      />

      {/* Domain Override (ISP Bypass) Modal */}
      <DomainOverrideModal
        extension={domainModalPlugin}
        onClose={() => setDomainModalPlugin(null)}
        onApplyOverride={handleApplyDomainOverride}
      />
    </div>
  );
};

export default App;
