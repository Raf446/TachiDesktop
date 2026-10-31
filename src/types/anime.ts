export type NavigationTab = 'library' | 'browse' | 'history' | 'extensions' | 'settings';

export type TrackerStatus = 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped';

export type AnimeStatus = 'Completed' | 'Ongoing' | 'Upcoming';

export type AnimeFormat = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL';

export interface AnimeSearchResult {
  id: string;
  malId?: number;
  anilistId?: number;
  title: string;
  romajiTitle?: string;
  coverUrl: string;
  bannerUrl?: string;
  score?: number;
  status?: AnimeStatus;
  format?: AnimeFormat;
  studio?: string;
  episodes?: number;
  watchedEpisodes?: number;
  year?: number;
  genres?: string[];
  url?: string;
  inLibrary?: boolean;
}

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  url: string;
  durationSec: number;
  watchedSec: number;
  completed: boolean;
  thumbnailUrl?: string;
  airDate?: string;
  isFiller?: boolean;
  isSpecial?: boolean;
  intro?: {
    start: number;
    end: number;
  };
}

export interface AnimeDetail {
  id: string;
  malId?: number;
  anilistId?: number;
  title: string;
  romajiTitle: string;
  nativeTitle?: string;
  coverUrl: string;
  bannerUrl?: string;
  score: number;
  status: AnimeStatus;
  format: AnimeFormat;
  studio: string;
  totalEpisodes: number;
  seasonYear?: number;
  synopsis: string;
  genres: string[];
  inLibrary: boolean;
  trackerStatus: TrackerStatus;
  trackedProgress: number;
  activeExtensionId: string;
  episodes: EpisodeItem[];
  specialEpisodes: EpisodeItem[];
}

export interface StreamSource {
  serverName: string;
  quality: '1080p' | '720p' | '480p' | '360p' | 'AUTO';
  url: string;
  type: 'hls' | 'mp4';
  headers?: Record<string, string>;
  subtitles?: { lang: string; label: string; url: string }[];
  intro?: { start: number; end: number };
}

export interface AnimeExtension {
  id: string;
  name: string;
  version: string;
  lang: 'id' | 'en' | 'multi';
  baseUrl: string;
  sourceRepoUrl?: string;
  generatedJsCode?: string;
  search(query: string, page?: number): Promise<AnimeSearchResult[]>;
  getAnimeDetails(urlOrId: string): Promise<AnimeDetail>;
  getEpisodeList(urlOrId: string): Promise<EpisodeItem[]>;
  getVideoStreams(episodeUrl: string): Promise<StreamSource[]>;
}

export interface StoredExtensionRecord {
  id: string;
  name: string;
  version: string;
  lang: 'id' | 'en' | 'multi';
  baseUrl: string;
  defaultBaseUrl: string;
  sourceRepoUrl: string;
  generatedJsCode: string;
  pingMs: number;
  hasUpdate?: boolean;
  isBuiltin?: boolean;
  updatedAt: string;
  extractedRules?: {
    searchPath: string;
    popularPath: string;
    episodeSelector: string;
    streamSelector: string;
  };
}

export interface ContinueWatchingItem {
  animeId: string;
  animeTitle: string;
  romajiTitle: string;
  coverUrl: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  watchedSec: number;
  durationSec: number;
  extensionId: string;
  updatedAt: string;
}

export interface DiscordActivityPayload {
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  currentTimeSec: number;
  durationSec: number;
  posterUrl?: string;
  sourceName?: string;
  isPaused?: boolean;
}

export interface DiscordRpcState {
  enabled: boolean;
  ipcConnected: boolean;
  lastUpdated?: string;
  statusMessage?: string;
}

export interface TrackerAccountConfig {
  malConnected: boolean;
  malUsername: string;
  anilistConnected: boolean;
  anilistUsername: string;
  autoScrobbleEnabled: boolean;
  autoScrobbleThreshold: number;
}

export interface TrackerSyncEvent {
  animeId: string;
  malId?: number;
  animeTitle: string;
  episodeNumber: number;
  totalEpisodes: number;
  status: TrackerStatus;
  syncedAt: string;
  provider: 'MyAnimeList' | 'AniList';
}

export interface PlayerStats {
  codec: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  bufferHealthSec: number;
  droppedFrames: number;
  activePluginId: string;
  activePluginName: string;
  mirrorServer: string;
  refererHeader: string;
  latencyPingMs: number;
  streamType: 'hls' | 'mp4';
}

export interface TachiGlobalBridge {
  proxyFetch: (url: string, headers?: Record<string, string>) => Promise<string>;
  registerExtension: (ext: AnimeExtension) => void;
}

declare global {
  interface Window {
    __TACHI_BRIDGE__?: TachiGlobalBridge;
    __TACHI_LAST_REGISTERED_EXTENSION__?: AnimeExtension | null;
  }
}
