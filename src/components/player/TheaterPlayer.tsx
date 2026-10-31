import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  Server,
  Activity,
  ListVideo,
  CheckCircle2,
  FastForward,
  RotateCcw,
} from 'lucide-react';
import {
  AnimeDetail,
  EpisodeItem,
  PlayerStats,
  StoredExtensionRecord,
  StreamSource,
} from '../../types/anime';
import {
  formatTimestamp,
  getDefaultStreamsForEpisode,
} from '../../services/anilistApi';
import { shouldTriggerAutoScrobble } from '../../services/trackerSync';
import { PlayerTimeline } from './PlayerTimeline';
import { StatsForNerds } from './StatsForNerds';
import { EpisodeDrawer } from './EpisodeDrawer';

interface TheaterPlayerProps {
  anime: AnimeDetail;
  episode: EpisodeItem;
  activeExtension: StoredExtensionRecord;
  customStreams?: StreamSource[];
  autoScrobbleThreshold: number;
  onBackToDetail: (lastWatchedSec: number) => void;
  onSelectEpisode: (nextEpisode: EpisodeItem) => void;
  onProgressUpdate: (episodeId: string, watchedSec: number, durationSec: number) => void;
  onAutoScrobbleTriggered: (episode: EpisodeItem) => void;
}

export const TheaterPlayer: React.FC<TheaterPlayerProps> = ({
  anime,
  episode,
  activeExtension,
  customStreams,
  autoScrobbleThreshold,
  onBackToDetail,
  onSelectEpisode,
  onProgressUpdate,
  onAutoScrobbleTriggered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideOsdTimerRef = useRef<number | null>(null);
  const resumeTimeRef = useRef<number>(episode.watchedSec > 0 && !episode.completed ? episode.watchedSec : 0);

  const availableStreams = useMemo(() => {
    if (customStreams && customStreams.length > 0) return customStreams;
    return getDefaultStreamsForEpisode(episode, `${activeExtension.name}.js`);
  }, [customStreams, episode, activeExtension.name]);

  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const activeStream = availableStreams[selectedStreamIdx] || availableStreams[0];

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [currentTime, setCurrentTime] = useState<number>(
    episode.watchedSec > 0 && !episode.completed ? episode.watchedSec : 0
  );
  const [duration, setDuration] = useState<number>(episode.durationSec || 1440);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [osdVisible, setOsdVisible] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showServerPopover, setShowServerPopover] = useState(false);
  const [scrobbledThisSession, setScrobbledThisSession] = useState(episode.completed);
  const [scrobbleBannerVisible, setScrobbleBannerVisible] = useState(false);

  const introRange = activeStream?.intro || episode.intro || { start: 80, end: 165 };
  const isInIntroZone =
    currentTime >= introRange.start && currentTime <= introRange.end;

  // Reset OSD auto-hide timer (2.5s when playing)
  const triggerOsdActivity = useCallback(() => {
    setOsdVisible(true);
    if (hideOsdTimerRef.current) {
      window.clearTimeout(hideOsdTimerRef.current);
    }
    if (isPlaying && !showServerPopover && !showDrawer) {
      hideOsdTimerRef.current = window.setTimeout(() => {
        setOsdVisible(false);
      }, 2500);
    }
  }, [isPlaying, showServerPopover, showDrawer]);

  useEffect(() => {
    triggerOsdActivity();
    return () => {
      if (hideOsdTimerRef.current) {
        window.clearTimeout(hideOsdTimerRef.current);
      }
    };
  }, [triggerOsdActivity]);

  // Reset session state when episode changes
  useEffect(() => {
    const startSec =
      episode.watchedSec > 0 && !episode.completed ? episode.watchedSec : 0;
    resumeTimeRef.current = startSec;
    setCurrentTime(startSec);
    setDuration(episode.durationSec || 1440);
    setScrobbledThisSession(episode.completed);
    setScrobbleBannerVisible(false);
  }, [episode.id, episode.watchedSec, episode.completed, episode.durationSec]);

  // Attach HLS.js or direct MP4 source without losing playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStream) return;

    const targetResumeTime = resumeTimeRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const restorePositionAndPlay = () => {
      if (targetResumeTime > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(targetResumeTime, Math.max(0, video.duration - 2));
      } else if (targetResumeTime > 0) {
        video.currentTime = targetResumeTime;
      }
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    };

    if (activeStream.type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(activeStream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        restorePositionAndPlay();
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // Automatic fallback to MP4 mirror if HLS stream fails
          const mp4FallbackIdx = availableStreams.findIndex((s) => s.type === 'mp4');
          if (mp4FallbackIdx !== -1 && mp4FallbackIdx !== selectedStreamIdx) {
            setSelectedStreamIdx(mp4FallbackIdx);
          }
        }
      });
    } else {
      video.src = activeStream.url;
      video.addEventListener('loadedmetadata', restorePositionAndPlay, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStream, availableStreams, selectedStreamIdx]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerOsdActivity();
  }, [triggerOsdActivity]);

  const handleSeek = useCallback(
    (targetSec: number) => {
      const video = videoRef.current;
      const clamped = Math.max(0, Math.min(duration, targetSec));
      resumeTimeRef.current = clamped;
      setCurrentTime(clamped);
      if (video && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(clamped, video.duration);
      }
      onProgressUpdate(episode.id, Math.floor(clamped), Math.floor(duration));
      triggerOsdActivity();
    },
    [duration, episode.id, onProgressUpdate, triggerOsdActivity]
  );

  const handleSkipIntro = useCallback(() => {
    const target = introRange.end;
    handleSeek(target);
  }, [handleSeek, introRange.end]);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    triggerOsdActivity();
  }, [triggerOsdActivity]);

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
    triggerOsdActivity();
  }, [triggerOsdActivity]);

  // Switch mirror server or quality while preserving current playback time
  const handleSelectStream = (index: number) => {
    resumeTimeRef.current = currentTime;
    setSelectedStreamIdx(index);
    setShowServerPopover(false);
    triggerOsdActivity();
  };

  // Next episode helper
  const nextEpisode = useMemo(() => {
    return anime.episodes.find((ep) => ep.number === episode.number + 1);
  }, [anime.episodes, episode.number]);

  // Keyboard Hotkeys: Space/K, F, J/L, S, M, I, E
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const key = e.key.toLowerCase();
      if (e.key === ' ' || key === 'k') {
        e.preventDefault();
        handleTogglePlay();
      } else if (key === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (key === 'j') {
        e.preventDefault();
        handleSeek(currentTime - 10);
      } else if (key === 'l') {
        e.preventDefault();
        handleSeek(currentTime + 10);
      } else if (key === 's') {
        e.preventDefault();
        handleSkipIntro();
      } else if (key === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (key === 'i') {
        e.preventDefault();
        setShowStats((prev) => !prev);
      } else if (key === 'e') {
        e.preventDefault();
        setShowDrawer((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (showDrawer) {
          setShowDrawer(false);
        } else if (showServerPopover) {
          setShowServerPopover(false);
        } else {
          onBackToDetail(Math.floor(currentTime));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentTime,
    handleSeek,
    handleSkipIntro,
    handleToggleFullscreen,
    handleToggleMute,
    handleTogglePlay,
    onBackToDetail,
    showDrawer,
    showServerPopover,
  ]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const nowSec = video.currentTime;
    const totalSec =
      Number.isFinite(video.duration) && video.duration > 100
        ? video.duration
        : episode.durationSec || 1440;

    resumeTimeRef.current = nowSec;
    setCurrentTime(nowSec);
    setDuration(totalSec);

    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }

    onProgressUpdate(episode.id, Math.floor(nowSec), Math.floor(totalSec));

    if (
      !scrobbledThisSession &&
      shouldTriggerAutoScrobble(nowSec, totalSec, autoScrobbleThreshold)
    ) {
      setScrobbledThisSession(true);
      setScrobbleBannerVisible(true);
      onAutoScrobbleTriggered(episode);
      window.setTimeout(() => setScrobbleBannerVisible(false), 4500);
    }
  };

  const playerStats: PlayerStats = useMemo(
    () => ({
      codec: activeStream.type === 'hls' ? 'avc1.640028 / mp4a.40.2' : 'h264 (High) / aac',
      resolution:
        activeStream.quality === '1080p'
          ? '1920x1080'
          : activeStream.quality === '720p'
            ? '1280x720'
            : '854x480',
      fps: 23.976,
      bitrateKbps:
        activeStream.quality === '1080p'
          ? 6420
          : activeStream.quality === '720p'
            ? 3850
            : 1920,
      bufferHealthSec: Math.max(4.2, bufferedEnd - currentTime),
      droppedFrames: 0,
      activePluginId: activeExtension.id,
      activePluginName: `${activeExtension.name}.js`,
      mirrorServer: activeStream.serverName,
      refererHeader: activeStream.headers?.Referer || `${activeExtension.baseUrl}/`,
      latencyPingMs: activeExtension.pingMs || 42,
      streamType: activeStream.type,
    }),
    [activeStream, activeExtension, bufferedEnd, currentTime]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerOsdActivity}
      className={`relative w-full h-full bg-black overflow-hidden select-none flex items-center justify-center ${
        osdVisible ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Core HTML5 Video Element */}
      <video
        ref={videoRef}
        onClick={handleTogglePlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        className="w-full h-full object-contain bg-black"
      />

      {/* MPV Stats For Nerds Overlay [I] */}
      <StatsForNerds
        visible={showStats}
        stats={playerStats}
        onClose={() => setShowStats(false)}
      />

      {/* Slide-out Episode Drawer [E] */}
      <EpisodeDrawer
        isOpen={showDrawer}
        episodes={anime.episodes}
        currentEpisodeId={episode.id}
        animeTitle={anime.title}
        onSelectEpisode={(nextEp) => {
          setShowDrawer(false);
          onSelectEpisode(nextEp);
        }}
        onClose={() => setShowDrawer(false)}
      />

      {/* 80% Auto-Scrobble Toast Notification */}
      {scrobbleBannerVisible && (
        <div className="absolute top-16 right-6 z-30 px-3.5 py-2.5 rounded-lg bg-[#14171e]/95 backdrop-blur-xl border border-emerald-500/40 shadow-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-zinc-100">
              Auto-Scrobbled (≥{autoScrobbleThreshold}%)
            </div>
            <div className="font-mono text-[11px] text-emerald-300">
              EP {String(episode.number).padStart(2, '0')} marked ✓ & synced to MyAnimeList
            </div>
          </div>
        </div>
      )}

      {/* Floating Skip Intro Button [S] */}
      {(isInIntroZone || osdVisible) && (
        <div
          className={`absolute right-6 bottom-24 z-20 transition-opacity duration-300 ${
            isInIntroZone ? 'opacity-100' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={handleSkipIntro}
            className="px-3.5 py-2 rounded-lg bg-[#14171e]/90 hover:bg-amber-500/20 backdrop-blur-xl border border-amber-500/60 text-xs font-medium text-amber-300 flex items-center gap-2 shadow-xl transition-all"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Lewati Opening (85s)</span>
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 font-mono text-[10px] text-amber-200">
              [S]
            </kbd>
          </button>
        </div>
      )}

      {/* Top Floating OSD Bar */}
      <div
        className={`absolute inset-x-0 top-0 z-20 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          osdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBackToDetail(Math.floor(currentTime))}
            className="h-8 px-3 rounded-md bg-[#14171e]/90 hover:bg-[#1e222d] backdrop-blur-xl border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Theater</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                EP {String(episode.number).padStart(2, '0')}
              </span>
              <h2 className="text-sm font-semibold text-zinc-100">
                {anime.title}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {episode.title} • {activeExtension.name}.js ({activeStream.serverName}{' '}
              {activeStream.quality})
            </p>
          </div>
        </div>

        {/* Top-Right Diagnostic & Episode Drawer Triggers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStats((prev) => !prev)}
            className={`h-8 px-2.5 rounded-md backdrop-blur-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showStats
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-[#14171e]/90 hover:bg-[#1e222d] border-white/[0.08] text-zinc-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Stats [I]</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDrawer((prev) => !prev)}
            className={`h-8 px-2.5 rounded-md backdrop-blur-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showDrawer
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-[#14171e]/90 hover:bg-[#1e222d] border-white/[0.08] text-zinc-300'
            }`}
          >
            <ListVideo className="w-3.5 h-3.5" />
            <span>Episodes [E]</span>
          </button>
        </div>
      </div>

      {/* Bottom IINA / MPV Floating Control HUD */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 px-6 pb-5 pt-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          osdVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Timeline with Intro Highlight */}
        <PlayerTimeline
          currentTime={currentTime}
          duration={duration}
          bufferedEnd={bufferedEnd}
          intro={introRange}
          onSeek={handleSeek}
        />

        {/* Controls Row */}
        <div className="mt-2 flex items-center justify-between gap-4">
          {/* Left: Play/Pause, Seek -10/+10, Volume, Monospace Timestamp */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime - 10)}
              title="Seek -10s [J]"
              className="px-2 py-1 rounded hover:bg-white/10 text-zinc-300 font-mono text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>-10s</span>
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime + 10)}
              title="Seek +10s [L]"
              className="px-2 py-1 rounded hover:bg-white/10 text-zinc-300 font-mono text-[11px] flex items-center gap-1"
            >
              <span>+10s</span>
              <SkipForward className="w-3 h-3" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label="Mute / Unmute"
                className="p-1.5 rounded hover:bg-white/10 text-zinc-300"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                aria-label="Volume"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                  }
                }}
                className="w-16 accent-indigo-500 cursor-pointer h-1 bg-white/20 rounded-lg"
              />
            </div>

            {/* Monospace Timestamp */}
            <div className="font-mono text-xs text-zinc-200 pl-2 border-l border-white/10">
              <span>{formatTimestamp(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span className="text-zinc-400">{formatTimestamp(duration)}</span>
            </div>
          </div>

          {/* Right: Server & Quality Switcher, Next Episode, Fullscreen */}
          <div className="flex items-center gap-2.5 relative">
            {scrobbledThisSession && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 font-mono text-[10px] text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> MAL Synced
              </span>
            )}

            {/* In-Player Server & Quality Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowServerPopover((prev) => !prev)}
                className="h-8 px-3 rounded-md bg-[#14171e]/90 hover:bg-[#1e222d] backdrop-blur-xl border border-white/[0.08] font-mono text-xs text-zinc-200 flex items-center gap-2 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {activeStream.serverName} • {activeStream.quality}
                </span>
              </button>

              {showServerPopover && (
                <div className="absolute right-0 bottom-10 w-60 rounded-lg bg-[#14171e]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-40">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-white/[0.07] mb-1">
                    Mirror & Resolution (Seamless Switch)
                  </div>
                  <div className="space-y-1">
                    {availableStreams.map((stream, idx) => {
                      const active = idx === selectedStreamIdx;
                      return (
                        <button
                          key={`${stream.serverName}-${stream.quality}-${idx}`}
                          type="button"
                          onClick={() => handleSelectStream(idx)}
                          className={`w-full px-2.5 py-1.5 rounded text-left font-mono text-xs flex items-center justify-between transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-zinc-300 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span>{stream.serverName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                            {stream.quality} ({stream.type.toUpperCase()})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {nextEpisode && (
              <button
                type="button"
                onClick={() => onSelectEpisode(nextEpisode)}
                className="h-8 px-3 rounded-md bg-[#14171e]/90 hover:bg-[#1e222d] backdrop-blur-xl border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <span>Next EP {String(nextEpisode.number).padStart(2, '0')}</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen [F]"
              className="w-8 h-8 rounded-md bg-[#14171e]/90 hover:bg-[#1e222d] backdrop-blur-xl border border-white/[0.08] text-zinc-200 flex items-center justify-center transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
