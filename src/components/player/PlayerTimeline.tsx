import React, { useRef, useState } from 'react';
import { formatTimestamp } from '../../services/anilistApi';

interface PlayerTimelineProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  intro?: { start: number; end: number };
  onSeek: (newTimeSec: number) => void;
}

export const PlayerTimeline: React.FC<PlayerTimelineProps> = ({
  currentTime,
  duration,
  bufferedEnd,
  intro,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);

  const safeDuration = Math.max(1, duration);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const bufferPercent = Math.min(100, Math.max(0, (bufferedEnd / safeDuration) * 100));

  const introStartPercent = intro
    ? Math.min(100, Math.max(0, (intro.start / safeDuration) * 100))
    : 0;
  const introWidthPercent = intro
    ? Math.min(
        100 - introStartPercent,
        Math.max(0, ((intro.end - intro.start) / safeDuration) * 100)
      )
    : 0;

  const calculateTimeFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverPercent(ratio * 100);
    setHoverTime(ratio * safeDuration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetTime = calculateTimeFromEvent(e);
    onSeek(targetTime);
  };

  const isHoverInIntro =
    intro && hoverTime !== null && hoverTime >= intro.start && hoverTime <= intro.end;

  return (
    <div className="w-full select-none">
      <div
        ref={trackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="group relative h-5 flex items-center cursor-pointer"
      >
        {/* Hover Time Preview Tooltip */}
        {hoverTime !== null && (
          <div
            style={{ left: `${hoverPercent}%` }}
            className=" -translate-x-1/2 -top-7 absolute px-2 py-0.5 rounded bg-[#14171e]/95 border border-white/10 font-mono text-[10px] text-zinc-100 whitespace-nowrap pointer-events-none flex items-center gap-1.5 shadow-lg"
          >
            <span>{formatTimestamp(hoverTime)}</span>
            {isHoverInIntro && (
              <span className="text-amber-400 font-semibold">• Opening (OP)</span>
            )}
          </div>
        )}

        {/* Base Track */}
        <div className="relative w-full h-1.5 group-hover:h-2 bg-white/15 rounded-full overflow-hidden transition-all">
          {/* Buffered Range */}
          <div
            style={{ width: `${bufferPercent}%` }}
            className="absolute inset-y-0 left-0 bg-white/25"
          />

          {/* Skip Intro Highlight Zone (Amber #f59e0b) */}
          {intro && introWidthPercent > 0 && (
            <div
              style={{
                left: `${introStartPercent}%`,
                width: `${introWidthPercent}%`,
              }}
              title="Opening Theme (01:20 - 02:45)"
              className="absolute inset-y-0 bg-amber-500/85 z-10"
            />
          )}

          {/* Watched Progress Bar (Crisp Indigo) */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="absolute inset-y-0 left-0 bg-indigo-500 z-20"
          />
        </div>

        {/* Playhead Thumb */}
        <div
          style={{ left: `${progressPercent}%` }}
          className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none"
        />
      </div>
    </div>
  );
};
