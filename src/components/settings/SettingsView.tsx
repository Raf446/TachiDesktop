import React, { useState } from 'react';
import {
  Settings,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  Tv,
  RefreshCw,
} from 'lucide-react';
import {
  DiscordRpcState,
  TrackerAccountConfig,
  TrackerSyncEvent,
} from '../../types/anime';

interface SettingsViewProps {
  discordStatus: DiscordRpcState;
  onToggleDiscordRpc: (enabled: boolean) => Promise<void>;
  trackerConfig: TrackerAccountConfig;
  onSaveTrackerConfig: (config: TrackerAccountConfig) => Promise<void>;
  scrobbleHistory: TrackerSyncEvent[];
  onTriggerTestScrobble: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  discordStatus,
  onToggleDiscordRpc,
  trackerConfig,
  onSaveTrackerConfig,
  scrobbleHistory,
  onTriggerTestScrobble,
}) => {
  const [defaultQuality, setDefaultQuality] = useState<'1080p' | '720p' | 'AUTO'>('1080p');
  const [autoSkipIntro, setAutoSkipIntro] = useState(false);
  const [malUsernameInput, setMalUsernameInput] = useState(trackerConfig.malUsername);
  const [anilistUsernameInput, setAnilistUsernameInput] = useState(
    trackerConfig.anilistUsername
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveTrackerConfig({
      ...trackerConfig,
      malUsername: malUsernameInput.trim() || 'Raf',
      anilistUsername: anilistUsernameInput.trim(),
      anilistConnected: Boolean(anilistUsernameInput.trim()),
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleToggleAutoScrobble = async () => {
    await onSaveTrackerConfig({
      ...trackerConfig,
      autoScrobbleEnabled: !trackerConfig.autoScrobbleEnabled,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#090a0d] px-6 py-5 space-y-6">
      {/* Header */}
      <div className="border-b border-white/[0.07] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">
              System Preferences, Tracker & Discord RPC
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure native Discord Rich Presence IPC, MyAnimeList 80% Auto-Scrobbler, and
            IINA/MPV playback defaults.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Native Discord Rich Presence (RPC) Section — Strictly 1 Toggle Switch */}
        <section className="bg-[#111317] border border-white/[0.07] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Discord Rich Presence (Native IPC)
              </h2>
            </div>

            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] border flex items-center gap-1.5 ${
                discordStatus.enabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800 border-white/[0.07] text-zinc-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  discordStatus.enabled ? 'bg-emerald-400' : 'bg-zinc-500'
                }`}
              />
              {discordStatus.enabled ? 'IPC Connected' : 'IPC Disconnected'}
            </span>
          </div>

          {/* Single Toggle Switch */}
          <div className="p-3.5 rounded-lg bg-[#14171f] border border-white/[0.07] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Tampilkan aktivitas menonton di profil Discord
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Menyiarkan judul anime, nomor episode, dan sisa durasi ke klien Discord
                desktop secara non-blocking.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={discordStatus.enabled}
              onClick={() => onToggleDiscordRpc(!discordStatus.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                discordStatus.enabled ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  discordStatus.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Rich Presence Activity Preview Card */}
          <div className="p-3.5 rounded-lg bg-[#090a0d] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Live Discord Profile Preview</span>
              <span>{discordStatus.enabled ? 'Broadcasting' : 'Standby'}</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-100 truncate">
                  TachiDesktop
                </div>
                <div className="text-[11px] text-zinc-300 truncate">
                  Attack on Titan: The Final Season
                </div>
                <div className="font-mono text-[10px] text-emerald-400 mt-0.5">
                  EP 14 • The Dawn of Humanity (18:24 / 24:00)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tracker & Auto-Scrobble 80% Section */}
        <section className="bg-[#111317] border border-white/[0.07] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                MyAnimeList & AniList Auto-Scrobbler (80%)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-emerald-400">
              Threshold: ≥ {trackerConfig.autoScrobbleThreshold}%
            </span>
          </div>

          {/* 80% Auto-Scrobble Toggle */}
          <div className="p-3.5 rounded-lg bg-[#14171f] border border-white/[0.07] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Auto-Scrobble saat durasi tontonan mencapai ≥ 80%
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Otomatis menandai episode selesai (✓) dan mengirim progress ke MyAnimeList /
                AniList.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={trackerConfig.autoScrobbleEnabled}
              onClick={handleToggleAutoScrobble}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                trackerConfig.autoScrobbleEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  trackerConfig.autoScrobbleEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Account Sync Form */}
          <form onSubmit={handleSaveAccounts} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  MyAnimeList Account
                </label>
                <input
                  type="text"
                  value={malUsernameInput}
                  onChange={(e) => setMalUsernameInput(e.target.value)}
                  placeholder="Raf"
                  className="w-full h-8 px-2.5 rounded bg-[#090a0d] border border-white/[0.08] font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  AniList Account (Optional)
                </label>
                <input
                  type="text"
                  value={anilistUsernameInput}
                  onChange={(e) => setAnilistUsernameInput(e.target.value)}
                  placeholder="AniList username..."
                  className="w-full h-8 px-2.5 rounded bg-[#090a0d] border border-white/[0.08] font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onTriggerTestScrobble}
                className="h-8 px-3 rounded bg-[#161920] hover:bg-[#1e222d] border border-white/[0.07] text-xs text-zinc-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 text-indigo-400" />
                <span>Simulate 80% Scrobble Sync</span>
              </button>

              <div className="flex items-center gap-2">
                {savedNotice && (
                  <span className="font-mono text-[11px] text-emerald-400">
                    Saved ✓
                  </span>
                )}
                <button
                  type="submit"
                  className="h-8 px-3.5 rounded bg-[#4f46e5] hover:bg-[#6366f1] text-xs font-semibold text-white"
                >
                  Save Tracker
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* 3. Player & Rust Network Proxy Defaults */}
      <section className="bg-[#111317] border border-white/[0.07] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              IINA / MPV Theater Player & Rust CORS Proxy
            </h2>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rust network.rs Referer/Origin Spoofing Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-[#14171f] border border-white/[0.07] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                Preferred Stream Quality
              </div>
              <div className="text-[11px] text-zinc-500">
                Fallback to 720p if unavailable
              </div>
            </div>
            <select
              value={defaultQuality}
              onChange={(e) =>
                setDefaultQuality(e.target.value as '1080p' | '720p' | 'AUTO')
              }
              className="h-7 px-2 rounded bg-[#090a0d] border border-white/[0.08] font-mono text-xs text-zinc-200"
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="AUTO">AUTO (HLS)</option>
            </select>
          </div>

          <div className="p-3 rounded bg-[#14171f] border border-white/[0.07] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                Auto-Skip Opening (OP)
              </div>
              <div className="text-[11px] text-zinc-500">
                Automatically jump amber OP zone
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoSkipIntro((prev) => !prev)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] ${
                autoSkipIntro
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#090a0d] text-zinc-400 border border-white/[0.07]'
              }`}
            >
              {autoSkipIntro ? 'AUTO-SKIP ON' : 'MANUAL [S]'}
            </button>
          </div>

          <div className="p-3 rounded bg-[#14171f] border border-white/[0.07] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                Auto-Hide Player OSD
              </div>
              <div className="text-[11px] text-zinc-500">
                Hides cursor & HUD when idle
              </div>
            </div>
            <span className="font-mono text-xs text-indigo-300">2.5 Seconds</span>
          </div>
        </div>
      </section>

      {/* 4. Recent Auto-Scrobble Sync History Log */}
      <section className="bg-[#111317] border border-white/[0.07] rounded-lg p-4 space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Recent Auto-Scrobble Sync Log ({scrobbleHistory.length})
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            AppData/tracker/scrobble_history.json
          </span>
        </div>

        {scrobbleHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 font-mono">
            No episodes scrobbled in this session yet. Watch an episode past 80% or click
            "Simulate 80% Scrobble Sync".
          </div>
        ) : (
          <div className="space-y-1.5">
            {scrobbleHistory.map((item, idx) => (
              <div
                key={`${item.animeId}-${item.episodeNumber}-${idx}`}
                className="px-3 py-2 rounded bg-[#14171f] border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ✓ EP {String(item.episodeNumber).padStart(2, '0')}
                  </span>
                  <span className="font-medium text-zinc-100 truncate">
                    {item.animeTitle}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    ({item.episodeNumber}/{item.totalEpisodes})
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                  <span className="text-indigo-300">{item.provider}</span>
                  <span className="text-zinc-500">{item.syncedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
