import {
  AnimeDetail,
  AnimeFormat,
  AnimeSearchResult,
  AnimeStatus,
  ContinueWatchingItem,
  EpisodeItem,
  StreamSource,
} from '../types/anime';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

function buildAotEpisodes(): EpisodeItem[] {
  const titles = [
    'The Other Side of the Sea',
    'Midnight Train',
    'The Door of Hope',
    'From One Hand to Another',
    'Declaration of War',
    'The War Hammer Titan',
    'Assault',
    'Assassin’s Bullet',
    'Brave Volunteers',
    'A Sound Argument',
    'Deceiver',
    'Guides',
    'Children of the Forest',
    'The Dawn of Humanity',
    'Savagery',
    'Sole Salvation',
    'Above and Below',
    'Sneak Attack',
    'Two Brothers',
    'Memories of the Future',
    'From You, 2,000 Years Ago',
    'Thaw',
    'Sunset',
    'Pride',
    'Night of the End',
    'Traitor',
    'Retrospective',
    'The Dawn of Humanity (Part 2 Finale)',
  ];

  return titles.map((title, idx) => {
    const epNum = idx + 1;
    const isCompleted = epNum <= 13;
    const isCurrent = epNum === 14;
    return {
      id: `aot-s4-ep-${epNum}`,
      number: epNum,
      title,
      url: `https://otakudesu.cloud/episode/shingeki-no-kyojin-s4-episode-${epNum}-sub-indo/`,
      durationSec: 1440,
      watchedSec: isCompleted ? 1440 : isCurrent ? 1104 : 0,
      completed: isCompleted,
      airDate: `2021-01-${String((idx % 28) + 1).padStart(2, '0')}`,
      intro: { start: 80, end: 165 },
    };
  });
}

function buildGenericEpisodes(animeId: string, count: number, watchedCount: number): EpisodeItem[] {
  return Array.from({ length: count }, (_, idx) => {
    const epNum = idx + 1;
    const completed = epNum <= watchedCount;
    const isCurrent = epNum === watchedCount + 1;
    return {
      id: `${animeId}-ep-${epNum}`,
      number: epNum,
      title: `Episode ${epNum}`,
      url: `https://otakudesu.cloud/episode/${animeId}-episode-${epNum}/`,
      durationSec: 1420,
      watchedSec: completed ? 1420 : isCurrent ? 640 : 0,
      completed,
      intro: { start: 80, end: 165 },
    };
  });
}

export const FALLBACK_ANIME_DETAILS: Record<string, AnimeDetail> = {
  'aot-final': {
    id: 'aot-final',
    malId: 40028,
    anilistId: 110277,
    title: 'Attack on Titan: The Final Season',
    romajiTitle: 'Shingeki no Kyojin • Season 4',
    nativeTitle: '進撃の巨人 The Final Season',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-sKUNX36y61FF.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/110277-iuGn6F5bK1U1.jpg',
    score: 9.01,
    status: 'Completed',
    format: 'TV',
    studio: 'Studio MAPPA',
    totalEpisodes: 28,
    seasonYear: 2021,
    synopsis:
      'Gabi Braun and Falco Grice have been training their entire lives to inherit one of the seven Titans under Marley’s control and aid their nation in eradicating the Eldians on Paradis. However, just as all seems well for the two cadets, their peace is suddenly shaken by the arrival of Eren Yeager and the remaining members of the Survey Corps. Having finally reached theamus basement and learned the dark truth of the world, the Survey Corps launches a decisive operation in Liberio that changes the fate of humanity forever.',
    genres: ['Action', 'Drama', 'Fantasy', 'Gore', 'Military'],
    inLibrary: true,
    trackerStatus: 'Watching',
    trackedProgress: 13,
    activeExtensionId: 'otakudesu',
    episodes: buildAotEpisodes(),
    specialEpisodes: [
      {
        id: 'aot-sp-1',
        number: 1,
        title: 'The Final Chapters: Special 1',
        url: 'https://otakudesu.cloud/episode/aot-final-chapters-sp-1/',
        durationSec: 3660,
        watchedSec: 0,
        completed: false,
        isSpecial: true,
        intro: { start: 90, end: 175 },
      },
      {
        id: 'aot-sp-2',
        number: 2,
        title: 'The Final Chapters: Special 2',
        url: 'https://otakudesu.cloud/episode/aot-final-chapters-sp-2/',
        durationSec: 5100,
        watchedSec: 0,
        completed: false,
        isSpecial: true,
        intro: { start: 100, end: 185 },
      },
    ],
  },
  'frieren': {
    id: 'frieren',
    malId: 52991,
    anilistId: 154587,
    title: 'Frieren: Beyond Journey’s End',
    romajiTitle: 'Sousou no Frieren',
    nativeTitle: '葬送のフリーレン',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    score: 9.32,
    status: 'Completed',
    format: 'TV',
    studio: 'Madhouse',
    totalEpisodes: 28,
    seasonYear: 2023,
    synopsis:
      'After a ten-year quest alongside the hero Himmel and his party, the elven mage Frieren defeats the Demon King and brings peace to the realm. Possessing an almost immortal lifespan, Frieren watches her companions slowly pass away, prompting her to embark on a new journey to understand humanity and the fleeting bonds she once took for granted.',
    genres: ['Adventure', 'Drama', 'Fantasy'],
    inLibrary: true,
    trackerStatus: 'Watching',
    trackedProgress: 8,
    activeExtensionId: 'samehadaku',
    episodes: buildGenericEpisodes('frieren', 28, 8),
    specialEpisodes: [],
  },
  'jjk-s2': {
    id: 'jjk-s2',
    malId: 51009,
    anilistId: 145064,
    title: 'Jujutsu Kaisen Season 2',
    romajiTitle: 'Jujutsu Kaisen: Shibuya Incident',
    nativeTitle: '呪術廻戦 懐玉・玉折／渋谷事変',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-5fa4ZBbW4dqA.jpg',
    score: 8.84,
    status: 'Completed',
    format: 'TV',
    studio: 'Studio MAPPA',
    totalEpisodes: 23,
    seasonYear: 2023,
    synopsis:
      'In 2006, high school sorcerers Satoru Gojo and Suguru Geto are tasked with escorting the Star Plasma Vessel, Riko Amanai, to Master Tengen. Years later in 2018, curses and curse users spring a catastrophic trap in Shibuya on Halloween night to seal Satoru Gojo.',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    inLibrary: true,
    trackerStatus: 'Completed',
    trackedProgress: 23,
    activeExtensionId: 'otakudesu',
    episodes: buildGenericEpisodes('jjk-s2', 23, 23),
    specialEpisodes: [],
  },
  'solo-leveling': {
    id: 'solo-leveling',
    malId: 52299,
    anilistId: 151807,
    title: 'Solo Leveling: Arise from the Shadow',
    romajiTitle: 'Ore dake Level Up na Ken',
    nativeTitle: '俺だけレベルアップな件',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1gX3iwfIsLu.png',
    score: 8.59,
    status: 'Ongoing',
    format: 'TV',
    studio: 'A-1 Pictures',
    totalEpisodes: 12,
    seasonYear: 2024,
    synopsis:
      'Known as the Weakest Hunter of All Mankind, E-rank hunter Sung Jinwoo barely survives a lethal double dungeon and awakens with a mysterious System interface visible only to him, granting him the ability to level up without limit.',
    genres: ['Action', 'Adventure', 'Fantasy'],
    inLibrary: false,
    trackerStatus: 'Watching',
    trackedProgress: 5,
    activeExtensionId: 'kuramanime',
    episodes: buildGenericEpisodes('solo-leveling', 12, 5),
    specialEpisodes: [],
  },
  'vinland-s2': {
    id: 'vinland-s2',
    malId: 49387,
    anilistId: 136430,
    title: 'Vinland Saga Season 2',
    romajiTitle: 'Vinland Saga • Farmland Arc',
    nativeTitle: 'ヴィンランド・サガ SEASON2',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx136430-YrQ8bbG0bd4I.jpg',
    score: 8.95,
    status: 'Completed',
    format: 'TV',
    studio: 'Studio MAPPA',
    totalEpisodes: 24,
    seasonYear: 2023,
    synopsis:
      'Sold into slavery after the death of Askeladd, Thorfinn labors on Ketil’s farm in Denmark alongside fellow slave Einar, confronting the weight of his violent past and seeking the meaning of a true warrior.',
    genres: ['Action', 'Adventure', 'Drama', 'Historical'],
    inLibrary: true,
    trackerStatus: 'Watching',
    trackedProgress: 11,
    activeExtensionId: 'hianime',
    episodes: buildGenericEpisodes('vinland-s2', 24, 11),
    specialEpisodes: [],
  },
  'chainsaw-man': {
    id: 'chainsaw-man',
    malId: 44511,
    anilistId: 127230,
    title: 'Chainsaw Man',
    romajiTitle: 'Chainsaw Man • Public Safety Arc',
    nativeTitle: 'チェンソーマン',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FlochcFsyoF4.png',
    score: 8.51,
    status: 'Completed',
    format: 'TV',
    studio: 'Studio MAPPA',
    totalEpisodes: 12,
    seasonYear: 2022,
    synopsis:
      'Betrayed by the yakuza he worked for to pay off his deceased father’s crushing debt, Denji merges with his chainsaw-devil companion Pochita and is recruited by Makima into Public Safety Devil Hunters Division 4.',
    genres: ['Action', 'Gore', 'Supernatural'],
    inLibrary: false,
    trackerStatus: 'Plan to Watch',
    trackedProgress: 0,
    activeExtensionId: 'otakudesu',
    episodes: buildGenericEpisodes('chainsaw-man', 12, 0),
    specialEpisodes: [],
  },
  'edgerunners': {
    id: 'edgerunners',
    malId: 42310,
    anilistId: 120377,
    title: 'Cyberpunk: Edgerunners',
    romajiTitle: 'Cyberpunk: Edgerunners',
    nativeTitle: 'サイバーパンク エッジランナーズ',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZP61466076.jpg',
    score: 8.68,
    status: 'Completed',
    format: 'ONA',
    studio: 'Trigger',
    totalEpisodes: 10,
    seasonYear: 2022,
    synopsis:
      'In a corruption-riddled Night City obsessed with cyberware modification, street kid David Martinez installs a military-grade Sandevistan implant and joins a crew of mercenary Edgerunners led by Maine and Lucy.',
    genres: ['Action', 'Sci-Fi', 'Psychological'],
    inLibrary: true,
    trackerStatus: 'Completed',
    trackedProgress: 10,
    activeExtensionId: 'hianime',
    episodes: buildGenericEpisodes('edgerunners', 10, 10),
    specialEpisodes: [],
  },
  'bocchi': {
    id: 'bocchi',
    malId: 47917,
    anilistId: 130003,
    title: 'Bocchi the Rock!',
    romajiTitle: 'Bocchi the Rock!',
    nativeTitle: 'ぼっち・ざ・ろっく！',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-5Yab6cM7lN74.png',
    score: 8.79,
    status: 'Completed',
    format: 'TV',
    studio: 'CloverWorks',
    totalEpisodes: 12,
    seasonYear: 2022,
    synopsis:
      'Severely socially anxious guitarist Hitori Gotoh dreams of performing in a band and gets pulled into Kessoku Band at the live house STARRY by drummer Nijika Ijichi.',
    genres: ['Comedy', 'Music', 'Slice of Life'],
    inLibrary: false,
    trackerStatus: 'Watching',
    trackedProgress: 4,
    activeExtensionId: 'samehadaku',
    episodes: buildGenericEpisodes('bocchi', 12, 4),
    specialEpisodes: [],
  },
};

export const INITIAL_CONTINUE_WATCHING: ContinueWatchingItem[] = [
  {
    animeId: 'aot-final',
    animeTitle: 'Attack on Titan: The Final Season',
    romajiTitle: 'Shingeki no Kyojin • Season 4',
    coverUrl: FALLBACK_ANIME_DETAILS['aot-final'].coverUrl,
    episodeId: 'aot-s4-ep-14',
    episodeNumber: 14,
    episodeTitle: 'The Dawn of Humanity',
    watchedSec: 1104,
    durationSec: 1440,
    extensionId: 'otakudesu',
    updatedAt: '12 mins ago',
  },
  {
    animeId: 'frieren',
    animeTitle: 'Frieren: Beyond Journey’s End',
    romajiTitle: 'Sousou no Frieren',
    coverUrl: FALLBACK_ANIME_DETAILS['frieren'].coverUrl,
    episodeId: 'frieren-ep-9',
    episodeNumber: 9,
    episodeTitle: 'Aura the Guillotine',
    watchedSec: 640,
    durationSec: 1420,
    extensionId: 'samehadaku',
    updatedAt: '3 hours ago',
  },
  {
    animeId: 'vinland-s2',
    animeTitle: 'Vinland Saga Season 2',
    romajiTitle: 'Vinland Saga • Farmland Arc',
    coverUrl: FALLBACK_ANIME_DETAILS['vinland-s2'].coverUrl,
    episodeId: 'vinland-s2-ep-12',
    episodeNumber: 12,
    episodeTitle: 'For the Love that Was Lost',
    watchedSec: 890,
    durationSec: 1440,
    extensionId: 'hianime',
    updatedAt: 'Yesterday',
  },
];

export function getFallbackCatalogList(): AnimeSearchResult[] {
  return Object.values(FALLBACK_ANIME_DETAILS).map((item) => ({
    id: item.id,
    malId: item.malId,
    anilistId: item.anilistId,
    title: item.title,
    romajiTitle: item.romajiTitle,
    coverUrl: item.coverUrl,
    bannerUrl: item.bannerUrl,
    score: item.score,
    status: item.status,
    format: item.format,
    studio: item.studio,
    episodes: item.totalEpisodes,
    watchedEpisodes: item.trackedProgress,
    year: item.seasonYear,
    genres: item.genres,
    inLibrary: item.inLibrary,
  }));
}

export async function fetchAniListTrending(searchQuery?: string): Promise<AnimeSearchResult[]> {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(type: ANIME, sort: TRENDING_DESC, search: $search, isAdult: false) {
          id
          idMal
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
          }
          bannerImage
          averageScore
          status
          format
          episodes
          seasonYear
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: searchQuery && searchQuery.trim() ? { search: searchQuery.trim() } : {},
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList HTTP ${response.status}`);
    }

    const json = await response.json();
    const mediaList = json?.data?.Page?.media;
    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      return filterFallbackCatalog(searchQuery);
    }

    const mapped: AnimeSearchResult[] = mediaList.map((m: Record<string, any>) => {
      const statusMap: Record<string, AnimeStatus> = {
        FINISHED: 'Completed',
        RELEASING: 'Ongoing',
        NOT_YET_RELEASED: 'Upcoming',
      };
      const formatMap: Record<string, AnimeFormat> = {
        TV: 'TV',
        MOVIE: 'MOVIE',
        OVA: 'OVA',
        ONA: 'ONA',
        SPECIAL: 'SPECIAL',
      };

      const titleObj = m.title || {};
      const studioNodes = m.studios?.nodes || [];

      return {
        id: `anilist-${m.id}`,
        malId: m.idMal || undefined,
        anilistId: m.id,
        title: titleObj.english || titleObj.romaji || 'Untitled Anime',
        romajiTitle: titleObj.romaji || titleObj.native || '',
        coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || '',
        bannerUrl: m.bannerImage || undefined,
        score: m.averageScore ? Number((m.averageScore / 10).toFixed(2)) : 8.5,
        status: statusMap[m.status] || 'Completed',
        format: formatMap[m.format] || 'TV',
        studio: studioNodes[0]?.name || 'Studio MAPPA',
        episodes: m.episodes || 12,
        year: m.seasonYear || 2024,
        genres: Array.isArray(m.genres) ? m.genres.slice(0, 5) : ['Action', 'Drama'],
        inLibrary: false,
      };
    });

    if (!searchQuery || !searchQuery.trim()) {
      const localAot = getFallbackCatalogList()[0];
      return [localAot, ...mapped.filter((item) => item.malId !== 40028)];
    }

    return mapped;
  } catch {
    return filterFallbackCatalog(searchQuery);
  }
}

function filterFallbackCatalog(searchQuery?: string): AnimeSearchResult[] {
  const list = getFallbackCatalogList();
  if (!searchQuery || !searchQuery.trim()) {
    return list;
  }
  const q = searchQuery.toLowerCase().trim();
  return list.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.romajiTitle && item.romajiTitle.toLowerCase().includes(q)) ||
      (item.studio && item.studio.toLowerCase().includes(q)) ||
      (item.genres && item.genres.some((g) => g.toLowerCase().includes(q)))
  );
}

export function getAnimeDetailById(animeOrId: string | AnimeSearchResult): AnimeDetail {
  const id = typeof animeOrId === 'string' ? animeOrId : animeOrId.id;
  if (FALLBACK_ANIME_DETAILS[id]) {
    return FALLBACK_ANIME_DETAILS[id];
  }

  if (typeof animeOrId !== 'string') {
    const epCount = animeOrId.episodes || 12;
    return {
      id: animeOrId.id,
      malId: animeOrId.malId,
      anilistId: animeOrId.anilistId,
      title: animeOrId.title,
      romajiTitle: animeOrId.romajiTitle || animeOrId.title,
      coverUrl: animeOrId.coverUrl,
      bannerUrl: animeOrId.bannerUrl,
      score: animeOrId.score || 8.65,
      status: animeOrId.status || 'Completed',
      format: animeOrId.format || 'TV',
      studio: animeOrId.studio || 'Studio MAPPA',
      totalEpisodes: epCount,
      seasonYear: animeOrId.year || 2024,
      synopsis:
        'Official metadata synchronized via AniList GraphQL Clean Shell. Select an installed .JS scraper extension from the left panel to resolve episode mirrors and HLS video streams.',
      genres: animeOrId.genres || ['Action', 'Drama', 'Fantasy'],
      inLibrary: Boolean(animeOrId.inLibrary),
      trackerStatus: 'Watching',
      trackedProgress: 1,
      activeExtensionId: 'otakudesu',
      episodes: buildGenericEpisodes(animeOrId.id, epCount, 1),
      specialEpisodes: [],
    };
  }

  return FALLBACK_ANIME_DETAILS['aot-final'];
}

export function getDefaultStreamsForEpisode(
  episode: EpisodeItem,
  pluginName = 'Otakudesu.js'
): StreamSource[] {
  const introRange = episode.intro || { start: 80, end: 165 };
  const refererUrl = pluginName.toLowerCase().includes('samehadaku')
    ? 'https://samehadaku.email/'
    : pluginName.toLowerCase().includes('hianime')
      ? 'https://hianime.to/'
      : 'https://otakudesu.cloud/';

  return [
    {
      serverName: 'DesuStream',
      quality: '1080p',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'hls',
      headers: {
        Referer: refererUrl,
        Origin: refererUrl.replace(/\/$/, ''),
      },
      subtitles: [
        { lang: 'id', label: 'Bahasa Indonesia (Otakudesu)', url: '' },
        { lang: 'en', label: 'English (Official Subs)', url: '' },
      ],
      intro: introRange,
    },
    {
      serverName: 'DesuStream',
      quality: '720p',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'hls',
      headers: {
        Referer: refererUrl,
      },
      intro: introRange,
    },
    {
      serverName: 'MegaCloud',
      quality: '1080p',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'mp4',
      headers: {
        Referer: 'https://megacloud.tv/',
      },
      intro: introRange,
    },
    {
      serverName: 'MegaCloud',
      quality: '480p',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      type: 'mp4',
      headers: {
        Referer: 'https://megacloud.tv/',
      },
      intro: introRange,
    },
    {
      serverName: 'StreamWish',
      quality: '720p',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      type: 'mp4',
      headers: {
        Referer: 'https://streamwish.to/',
      },
      intro: introRange,
    },
  ];
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
