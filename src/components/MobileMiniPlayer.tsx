import React from 'react';
import { Song, PlaybackState } from '../types';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react';

interface MobileMiniPlayerProps {
  currentSong: Song | null;
  playbackState: PlaybackState;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavorite: (id: string) => void;
  onScrollToTop: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  currentSong,
  playbackState,
  elapsed,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onToggleFavorite,
  onScrollToTop,
}) => {
  if (!currentSong) return null;

  const isPlaying = playbackState === 'play';
  const progressPercent = currentSong.duration > 0
    ? Math.min(100, Math.max(0, (elapsed / currentSong.duration) * 100))
    : 0;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181825]/95 backdrop-blur-lg border-t border-[#313244] shadow-2xl">
      {/* Tiny progress line */}
      <div className="w-full h-1 bg-[#313244]">
        <div
          className="h-full bg-gradient-to-r from-[#fab387] to-[#cba6f7] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
        {/* Track info & sprout icon */}
        <div
          onClick={onScrollToTop}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <div
            className={`w-9 h-9 rounded-full bg-[#1e1e2e] border border-[#313244] flex items-center justify-center shrink-0 shadow-sm ${
              isPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-spin-paused'
            }`}
          >
            <span className="text-sm">🌱</span>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#cdd6f4] truncate">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-[#a6adc8] truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(currentSong.id)}
            className="p-2 text-[#a6adc8] hover:text-[#f38ba8]"
          >
            <Heart
              className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-[#f38ba8] text-[#f38ba8]' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="p-2 text-[#cdd6f4] hover:text-[#fab387]"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            className="w-9 h-9 rounded-xl bg-[#fab387] text-[#11111b] flex items-center justify-center shadow-md active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            className="p-2 text-[#cdd6f4] hover:text-[#fab387]"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
