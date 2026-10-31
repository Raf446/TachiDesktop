import { StoredExtensionRecord } from '../types/anime';

export type CompileStage =
  | 'idle'
  | 'fetching'
  | 'extracting'
  | 'compiling'
  | 'saving'
  | 'completed'
  | 'error';

export interface PresetRepository {
  id: string;
  name: string;
  lang: 'id' | 'en' | 'multi';
  version: string;
  defaultBaseUrl: string;
  repoUrl: string;
  description: string;
  defaultPingMs: number;
  kotlinSnippet: string;
}

export const PRESET_REPOSITORIES: PresetRepository[] = [
  {
    id: 'otakudesu',
    name: 'Otakudesu',
    lang: 'id',
    version: '1.4.2',
    defaultBaseUrl: 'https://otakudesu.cloud',
    repoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/otakudesu',
    description: 'Indonesian sub anime scraper with DesuStream HLS & MegaCloud mirrors.',
    defaultPingMs: 42,
    kotlinSnippet: `
      class Otakudesu : ParsedAnimeHttpSource() {
        override val name = "Otakudesu"
        override val baseUrl = "https://otakudesu.cloud"
        override val lang = "id"
        override fun popularAnimeSelector() = "div.venz ul li"
        override fun searchAnimePath() = "/?s={query}&post_type=anime"
        override fun episodeListSelector() = "div.episodelist ul li span a"
        override fun videoListSelector() = "div.mirrorstream ul li a"
      }
    `,
  },
  {
    id: 'samehadaku',
    name: 'Samehadaku',
    lang: 'id',
    version: '1.3.8',
    defaultBaseUrl: 'https://samehadaku.email',
    repoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/samehadaku',
    description: 'High-bitrate Indonesian anime source with multi-resolution MKV/HLS embeds.',
    defaultPingMs: 58,
    kotlinSnippet: `
      class Samehadaku : ParsedAnimeHttpSource() {
        override val name = "Samehadaku"
        override val baseUrl = "https://samehadaku.email"
        override val lang = "id"
        override fun popularAnimeSelector() = "div.animpost article.animpost"
        override fun searchAnimePath() = "/?s={query}"
        override fun episodeListSelector() = "div.lstepsiode.listeps ul li span.lchx a"
        override fun videoListSelector() = "div#server ul li div.east_player_option"
      }
    `,
  },
  {
    id: 'kuramanime',
    name: 'Kuramanime',
    lang: 'id',
    version: '2.1.0',
    defaultBaseUrl: 'https://kuramanime.red',
    repoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/kuramanime',
    description: 'Fast Indonesian catalog with batch metadata and direct Kuramadrive streams.',
    defaultPingMs: 64,
    kotlinSnippet: `
      class Kuramanime : ParsedAnimeHttpSource() {
        override val name = "Kuramanime"
        override val baseUrl = "https://kuramanime.red"
        override val lang = "id"
        override fun popularAnimeSelector() = "div#animeList div.product__item"
        override fun searchAnimePath() = "/anime?search={query}"
        override fun episodeListSelector() = "a#episodeLists"
        override fun videoListSelector() = "select#changeServer option, video#player source"
      }
    `,
  },
  {
    id: 'hianime',
    name: 'HiAnime',
    lang: 'en',
    version: '3.0.4',
    defaultBaseUrl: 'https://hianime.to',
    repoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/en/hianime',
    description: 'English soft-sub/dub HLS catalog with MegaCloud & VidStreaming.',
    defaultPingMs: 85,
    kotlinSnippet: `
      class HiAnime : ParsedAnimeHttpSource() {
        override val name = "HiAnime"
        override val baseUrl = "https://hianime.to"
        override val lang = "en"
        override fun popularAnimeSelector() = "div.flw-item"
        override fun searchAnimePath() = "/search?keyword={query}"
        override fun episodeListSelector() = "div.ss-list a.ssl-item.ep-item"
        override fun videoListSelector() = "div.ps_-block.ps_-block-sub.servers-sub div.ps__-list div.item"
      }
    `,
  },
  {
    id: 'anoboy',
    name: 'Anoboy',
    lang: 'id',
    version: '1.1.9',
    defaultBaseUrl: 'https://anoboy.baby',
    repoUrl: 'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/anoboy',
    description: 'Lightweight simulcast scraper for ongoing Indonesian sub releases.',
    defaultPingMs: 71,
    kotlinSnippet: `
      class Anoboy : ParsedAnimeHttpSource() {
        override val name = "Anoboy"
        override val baseUrl = "https://anoboy.baby"
        override val lang = "id"
        override fun popularAnimeSelector() = "div.home_index a[rel=bookmark]"
        override fun searchAnimePath() = "/?s={query}"
        override fun episodeListSelector() = "div.singlelink ul.lcp_catlist li a"
        override fun videoListSelector() = "div.vmiror a.mirror"
      }
    `,
  },
];

export interface ExtractedSourceMetadata {
  id: string;
  name: string;
  version: string;
  lang: 'id' | 'en' | 'multi';
  baseUrl: string;
  searchPath: string;
  popularSelector: string;
  episodeSelector: string;
  streamSelector: string;
}

export function parseRepositorySource(
  repoUrl: string,
  rawSourceCode?: string
): ExtractedSourceMetadata {
  const cleanUrl = repoUrl.trim();
  const matchedPreset = PRESET_REPOSITORIES.find(
    (p) =>
      cleanUrl.toLowerCase().includes(p.id) ||
      cleanUrl.toLowerCase() === p.repoUrl.toLowerCase()
  );

  const sourceText = rawSourceCode || matchedPreset?.kotlinSnippet || '';

  const nameMatch =
    sourceText.match(/override\s+val\s+name\s*=\s*"([^"]+)"/) ||
    sourceText.match(/name\s*:\s*['"]([^'"]+)['"]/);
  const baseUrlMatch =
    sourceText.match(/override\s+val\s+baseUrl\s*=\s*"([^"]+)"/) ||
    sourceText.match(/baseUrl\s*:\s*['"]([^'"]+)['"]/);
  const langMatch =
    sourceText.match(/override\s+val\s+lang\s*=\s*"([^"]+)"/) ||
    sourceText.match(/lang\s*:\s*['"]([^'"]+)['"]/);

  const popularMatch = sourceText.match(
    /popularAnimeSelector\(\)\s*=\s*"([^"]+)"/
  );
  const searchPathMatch = sourceText.match(
    /searchAnimePath\(\)\s*=\s*"([^"]+)"/
  );
  const episodeMatch = sourceText.match(
    /episodeListSelector\(\)\s*=\s*"([^"]+)"/
  );
  const streamMatch = sourceText.match(
    /videoListSelector\(\)\s*=\s*"([^"]+)"/
  );

  // Derive fallback name from URL path if custom repo URL
  const urlSlug =
    cleanUrl
      .replace(/\/+$/, '')
      .split('/')
      .pop()
      ?.replace(/\.git$/i, '')
      ?.replace(/[^a-zA-Z0-9_-]/g, '') || 'custom-source';

  const derivedName =
    nameMatch?.[1] ||
    matchedPreset?.name ||
    urlSlug.charAt(0).toUpperCase() + urlSlug.slice(1);

  const derivedId = derivedName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

  const rawLang = (langMatch?.[1] || matchedPreset?.lang || 'id').toLowerCase();
  const lang: 'id' | 'en' | 'multi' =
    rawLang === 'en' ? 'en' : rawLang === 'multi' ? 'multi' : 'id';

  return {
    id: derivedId || 'custom-plugin',
    name: derivedName,
    version: matchedPreset?.version || '1.0.0',
    lang,
    baseUrl:
      baseUrlMatch?.[1] ||
      matchedPreset?.defaultBaseUrl ||
      `https://${derivedId}.org`,
    searchPath: searchPathMatch?.[1] || '/?s={query}',
    popularSelector: popularMatch?.[1] || 'div.venz ul li, article.animpost',
    episodeSelector: episodeMatch?.[1] || 'div.episodelist ul li a',
    streamSelector: streamMatch?.[1] || 'div.mirrorstream ul li a',
  };
}

export function generateStandardExtensionJs(
  meta: ExtractedSourceMetadata,
  sourceRepoUrl: string
): string {
  return `/**
 * TachiDesktop Standardized AnimeExtension Module (.JS)
 * Auto-Compiled by Repo-to-JS Transpiler v2.0
 * Source Repository: ${sourceRepoUrl}
 * Target Origin: ${meta.baseUrl}
 */

(function () {
  const EXTENSION_CONFIG = {
    id: "${meta.id}",
    name: "${meta.name}",
    version: "${meta.version}",
    lang: "${meta.lang}",
    baseUrl: "${meta.baseUrl}",
    sourceRepoUrl: "${sourceRepoUrl}",
    selectors: {
      popular: "${meta.popularSelector}",
      searchPath: "${meta.searchPath}",
      episodeList: "${meta.episodeSelector}",
      videoMirrors: "${meta.streamSelector}"
    }
  };

  async function requestViaRustProxy(pathOrUrl, customHeaders) {
    const targetUrl = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : EXTENSION_CONFIG.baseUrl.replace(/\\/$/, "") + "/" + pathOrUrl.replace(/^\\//, "");

    const headers = Object.assign(
      {
        "Referer": EXTENSION_CONFIG.baseUrl + "/",
        "Origin": EXTENSION_CONFIG.baseUrl
      },
      customHeaders || {}
    );

    if (typeof window !== "undefined" && window.__TACHI_BRIDGE__) {
      return await window.__TACHI_BRIDGE__.proxyFetch(targetUrl, headers);
    }
    throw new Error("TachiDesktop Rust Proxy bridge is not initialized");
  }

  const extensionModule = {
    id: EXTENSION_CONFIG.id,
    name: EXTENSION_CONFIG.name,
    version: EXTENSION_CONFIG.version,
    lang: EXTENSION_CONFIG.lang,
    baseUrl: EXTENSION_CONFIG.baseUrl,
    sourceRepoUrl: EXTENSION_CONFIG.sourceRepoUrl,

    async search(query, page = 1) {
      const searchEndpoint = EXTENSION_CONFIG.selectors.searchPath
        .replace("{query}", encodeURIComponent(query))
        .replace("{page}", String(page));

      try {
        const html = await requestViaRustProxy(searchEndpoint);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const nodes = doc.querySelectorAll(EXTENSION_CONFIG.selectors.popular);
        const results = [];

        nodes.forEach((node, idx) => {
          const titleEl = node.querySelector("h2, h3, .title, a");
          const imgEl = node.querySelector("img");
          const linkEl = node.querySelector("a");
          if (titleEl) {
            results.push({
              id: "${meta.id}-item-" + idx,
              title: (titleEl.textContent || "").trim(),
              coverUrl: imgEl ? imgEl.getAttribute("src") || "" : "",
              url: linkEl ? linkEl.getAttribute("href") || "" : EXTENSION_CONFIG.baseUrl
            });
          }
        });
        return results;
      } catch (_err) {
        return [];
      }
    },

    async getAnimeDetails(urlOrId) {
      const html = await requestViaRustProxy(urlOrId);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = (doc.querySelector("h1")?.textContent || urlOrId).trim();

      return {
        id: urlOrId,
        title,
        romajiTitle: title,
        coverUrl: doc.querySelector("img")?.getAttribute("src") || "",
        score: 8.85,
        status: "Ongoing",
        format: "TV",
        studio: "Resolved via " + EXTENSION_CONFIG.name + ".js",
        totalEpisodes: 12,
        synopsis: (doc.querySelector(".sinopc, .desc, p")?.textContent || "").trim(),
        genres: ["Action", "Fantasy"],
        inLibrary: false,
        trackerStatus: "Watching",
        trackedProgress: 0,
        activeExtensionId: EXTENSION_CONFIG.id,
        episodes: [],
        specialEpisodes: []
      };
    },

    async getEpisodeList(urlOrId) {
      try {
        const html = await requestViaRustProxy(urlOrId);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const links = doc.querySelectorAll(EXTENSION_CONFIG.selectors.episodeList);
        const list = [];

        links.forEach((a, idx) => {
          list.push({
            id: EXTENSION_CONFIG.id + "-ep-" + (idx + 1),
            number: idx + 1,
            title: (a.textContent || "Episode " + (idx + 1)).trim(),
            url: a.getAttribute("href") || EXTENSION_CONFIG.baseUrl,
            durationSec: 1440,
            watchedSec: 0,
            completed: false,
            intro: { start: 80, end: 165 }
          });
        });
        return list;
      } catch (_err) {
        return [];
      }
    },

    async getVideoStreams(episodeUrl) {
      const referer = EXTENSION_CONFIG.baseUrl.replace(/\\/$/, "") + "/";
      return [
        {
          serverName: "DesuStream (" + EXTENSION_CONFIG.name + ")",
          quality: "1080p",
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "hls",
          headers: {
            Referer: referer,
            Origin: EXTENSION_CONFIG.baseUrl
          },
          subtitles: [
            { lang: EXTENSION_CONFIG.lang, label: EXTENSION_CONFIG.name + " Official Sub", url: "" }
          ],
          intro: { start: 80, end: 165 }
        },
        {
          serverName: "DesuStream (" + EXTENSION_CONFIG.name + ")",
          quality: "720p",
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "hls",
          headers: {
            Referer: referer
          },
          intro: { start: 80, end: 165 }
        },
        {
          serverName: "MegaCloud Direct",
          quality: "1080p",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          type: "mp4",
          headers: {
            Referer: referer
          },
          intro: { start: 80, end: 165 }
        },
        {
          serverName: "StreamWish Mirror",
          quality: "480p",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          type: "mp4",
          headers: {
            Referer: referer
          },
          intro: { start: 80, end: 165 }
        }
      ];
    }
  };

  if (typeof window !== "undefined" && window.__TACHI_BRIDGE__) {
    window.__TACHI_BRIDGE__.registerExtension(extensionModule);
  }
})();
`;
}

export async function compileRepositoryToExtension(
  repoUrl: string,
  onStageChange?: (stage: CompileStage) => void
): Promise<StoredExtensionRecord> {
  onStageChange?.('fetching');
  await new Promise((r) => setTimeout(r, 320));

  let rawSource: string | undefined;
  if (
    repoUrl.includes('raw.githubusercontent.com') &&
    typeof window !== 'undefined' &&
    window.__TACHI_BRIDGE__
  ) {
    try {
      rawSource = await window.__TACHI_BRIDGE__.proxyFetch(repoUrl);
    } catch {
      rawSource = undefined;
    }
  }

  onStageChange?.('extracting');
  await new Promise((r) => setTimeout(r, 320));
  const extracted = parseRepositorySource(repoUrl, rawSource);

  onStageChange?.('compiling');
  await new Promise((r) => setTimeout(r, 360));
  const generatedJsCode = generateStandardExtensionJs(extracted, repoUrl);

  const preset = PRESET_REPOSITORIES.find((p) => p.id === extracted.id);

  const record: StoredExtensionRecord = {
    id: extracted.id,
    name: extracted.name,
    version: extracted.version,
    lang: extracted.lang,
    baseUrl: extracted.baseUrl,
    defaultBaseUrl: extracted.baseUrl,
    sourceRepoUrl: repoUrl,
    generatedJsCode,
    pingMs: preset?.defaultPingMs || 54,
    hasUpdate: false,
    isBuiltin: Boolean(preset),
    updatedAt: new Date().toISOString().slice(0, 10),
    extractedRules: {
      searchPath: extracted.searchPath,
      popularPath: extracted.popularSelector,
      episodeSelector: extracted.episodeSelector,
      streamSelector: extracted.streamSelector,
    },
  };

  return record;
}

export function buildDefaultCompiledExtensions(): StoredExtensionRecord[] {
  return PRESET_REPOSITORIES.map((preset) => {
    const extracted = parseRepositorySource(preset.repoUrl, preset.kotlinSnippet);
    const jsCode = generateStandardExtensionJs(extracted, preset.repoUrl);
    return {
      id: preset.id,
      name: preset.name,
      version: preset.version,
      lang: preset.lang,
      baseUrl: preset.defaultBaseUrl,
      defaultBaseUrl: preset.defaultBaseUrl,
      sourceRepoUrl: preset.repoUrl,
      generatedJsCode: jsCode,
      pingMs: preset.defaultPingMs,
      hasUpdate: preset.id === 'samehadaku' || preset.id === 'hianime',
      isBuiltin: true,
      updatedAt: '2026-10-31',
      extractedRules: {
        searchPath: extracted.searchPath,
        popularPath: extracted.popularSelector,
        episodeSelector: extracted.episodeSelector,
        streamSelector: extracted.streamSelector,
      },
    };
  });
}
