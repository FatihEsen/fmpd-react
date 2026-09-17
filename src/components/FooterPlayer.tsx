import React, { useRef } from 'react';
import { Song, MpdStatus } from '../types';
import { formatTime } from '../utils/formatters';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Flame,
  Heart,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  StepForward,
  Trash2,
  Save,
} from 'lucide-react';

interface FooterPlayerProps {
  currentSong: Song | null;
  status: MpdStatus;
  selectedCount: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleRandom: () => void;
  onToggleRepeat: () => void;
  onToggleSingle: () => void;
  onToggleConsume: () => void;
  onToggleFavorite: (id: string) => void;
  onBatchDelete?: () => void;
  onBatchMoveUp?: () => void;
  onBatchMoveDown?: () => void;
  onBatchQueueNext?: () => void;
  onOpenSaveModal?: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onScrollToTop?: () => void;
}

export const FooterPlayer: React.FC<FooterPlayerProps> = ({
  currentSong,
  status,
  selectedCount,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onSeek,
  onToggleRandom,
  onToggleRepeat,
  onToggleSingle,
  onToggleConsume,
  onToggleFavorite,
  onBatchDelete,
  onBatchMoveUp,
  onBatchMoveDown,
  onBatchQueueNext,
  onOpenSaveModal,
  onVolumeChange,
  onToggleMute,
  isMuted,
  onScrollToTop,
}) => {
  const seekbarRef = useRef<HTMLDivElement>(null);
  const isPlaying = status.state === 'play';

  // Seekbar click handler
  const handleSeekbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekbarRef.current || !currentSong || currentSong.duration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percent * currentSong.duration);
  };

  // Mouse wheel on seekbar (+/- 5s)
  const handleSeekbarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!currentSong || currentSong.duration <= 0) return;
    const delta = e.deltaY < 0 ? 5 : -5;
    const newTime = Math.max(0, Math.min(currentSong.duration, status.elapsed + delta));
    onSeek(newTime);
  };

  // Mouse wheel on volume (+/- 3%)
  const handleVolumeWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 3 : -3;
    const newVol = Math.max(0, Math.min(100, status.volume + delta));
    onVolumeChange(newVol);
  };

  const progressPercent =
    currentSong && currentSong.duration > 0
      ? Math.min(100, Math.max(0, (status.elapsed / currentSong.duration) * 100))
      : 0;

  return (
    <footer
      id="footer-now-playing"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#181825]/95 backdrop-blur-xl border-t border-[#313244] shadow-[0_-8px_30px_rgba(0,0,0,0.4)] transition-all select-none"
    >
      {/* Top Thin Interactive Seek/Progress Line */}
      <div
        ref={seekbarRef}
        onClick={handleSeekbarClick}
        onWheel={handleSeekbarWheel}
        className="w-full h-1.5 bg-[#313244] cursor-pointer relative group hover:h-2 transition-all"
        title="İlerlemek için tıklayın veya mouse tekerleğiyle sarın"
      >
        <div
          className="h-full bg-gradient-to-r from-[#fab387] via-[#cba6f7] to-[#a6e3a1] transition-all duration-150 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 md:gap-6">
        {/* ================= LEFT SECTION: Track Info & Thumbnail ================= */}
        <div className="flex items-center gap-3 min-w-0 max-w-[280px] sm:max-w-xs md:max-w-sm flex-1 md:flex-initial">
          {/* Animated Vinyl Disk Thumbnail */}
          <div
            onClick={onScrollToTop}
            title={currentSong ? `${currentSong.title} - ${currentSong.artist}` : 'Oynatıcı'}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#11111b] border-2 border-[#313244] shadow-md flex items-center justify-center shrink-0 cursor-pointer hover:border-[#fab387]/50 transition-colors"
          >
            {/* Spinning Center Accent */}
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-[#fab387] to-[#cba6f7] flex items-center justify-center shadow-sm text-xs ${
                isPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-spin-paused'
              }`}
            >
              <span>🌱</span>
            </div>
          </div>

          {/* Titles & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4
                onClick={onScrollToTop}
                className="text-xs sm:text-sm font-bold text-[#cdd6f4] truncate hover:text-[#fab387] cursor-pointer transition-colors"
                title={currentSong ? currentSong.title : 'Parça Seçilmedi'}
              >
                {currentSong ? currentSong.title : 'Parça Seçilmedi'}
              </h4>

              {status.audioFormat && (
                <span className="hidden xl:inline-block text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#313244] text-[#a6e3a1] border border-[#a6e3a1]/20 shrink-0">
                  {status.audioFormat}
                </span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-[#a6adc8] truncate mt-0.5">
              <span className="text-[#fab387] font-medium">
                {currentSong ? currentSong.artist : 'MPD Bekliyor'}
              </span>
              {currentSong?.album && (
                <>
                  <span className="text-[#6c7086] mx-1">•</span>
                  <span className="text-[#bac2de] hidden sm:inline truncate">
                    {currentSong.album}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Favorite Button */}
          {currentSong && (
            <button
              type="button"
              onClick={() => onToggleFavorite(currentSong.id)}
              title={currentSong.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              className="p-1.5 sm:p-2 text-[#a6adc8] hover:text-[#f38ba8] hover:bg-[#313244]/60 rounded-xl transition-all shrink-0"
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  currentSong.isFavorite ? 'fill-[#f38ba8] text-[#f38ba8]' : ''
                }`}
              />
            </button>
          )}
        </div>

        {/* ================= CENTER SECTION: Transport Controls & Seek Time ================= */}
        <div className="hidden md:flex flex-col items-center gap-1 flex-1 max-w-xl">
          {/* Main Controls Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Random / Shuffle */}
            <button
              type="button"
              onClick={onToggleRandom}
              title="Karışık Çal (z)"
              className={`p-1.5 rounded-lg transition-all ${
                status.random
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Prev Track */}
            <button
              type="button"
              onClick={onPrev}
              title="Önceki Parça (b)"
              className="p-1.5 sm:p-2 text-[#cdd6f4] hover:text-[#fab387] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              type="button"
              onClick={isPlaying ? onPause : onPlay}
              title="Oynat / Duraklat (Space)"
              className="w-10 h-10 rounded-full bg-[#fab387] hover:bg-[#f9e2af] text-[#11111b] flex items-center justify-center shadow-lg hover:shadow-[#fab387]/30 transition-all active:scale-90 mx-1"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Stop */}
            <button
              type="button"
              onClick={onStop}
              title="Durdur"
              className="p-1.5 sm:p-2 text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={onNext}
              title="Sonraki Parça (n)"
              className="p-1.5 sm:p-2 text-[#cdd6f4] hover:text-[#fab387] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={onToggleRepeat}
              title="Tekrar Modu (r)"
              className={`p-1.5 rounded-lg transition-all ${
                status.repeat
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Single */}
            <button
              type="button"
              onClick={onToggleSingle}
              title="Tek Şarkı Tekrarı (y)"
              className={`p-1.5 rounded-lg transition-all hidden lg:inline-flex ${
                status.single
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Repeat1 className="w-3.5 h-3.5" />
            </button>

            {/* Consume */}
            <button
              type="button"
              onClick={onToggleConsume}
              title="Tüket Modu (x)"
              className={`p-1.5 rounded-lg transition-all hidden lg:inline-flex ${
                status.consume
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time Displays */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#a6adc8]">
            <span className="text-[#cdd6f4] font-medium">
              {formatTime(status.elapsed)}
            </span>
            <span>/</span>
            <span>{formatTime(currentSong?.duration || 0)}</span>
          </div>
        </div>

        {/* ================= RIGHT SECTION: Volume & Quick Actions ================= */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          {/* Batch selected count & quick buttons if items are selected */}
          {selectedCount > 0 && (
            <div className="hidden xl:flex items-center gap-1 bg-[#313244]/80 px-2 py-1 rounded-xl border border-[#45475a]/50">
              <span className="text-[11px] text-[#fab387] font-bold px-1">
                {selectedCount} seçili
              </span>
              {onBatchMoveUp && (
                <button
                  type="button"
                  onClick={onBatchMoveUp}
                  title="Seçilenleri Yukarı Taşı (Shift+K)"
                  className="p-1 hover:text-[#fab387] rounded"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {onBatchQueueNext && (
                <button
                  type="button"
                  onClick={onBatchQueueNext}
                  title="Sıradaki Yap (ö)"
                  className="p-1 text-[#fab387] hover:scale-110 rounded"
                >
                  <StepForward className="w-3.5 h-3.5" />
                </button>
              )}
              {onBatchMoveDown && (
                <button
                  type="button"
                  onClick={onBatchMoveDown}
                  title="Seçilenleri Aşağı Taşı (Shift+J)"
                  className="p-1 hover:text-[#fab387] rounded"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
              {onBatchDelete && (
                <button
                  type="button"
                  onClick={onBatchDelete}
                  title="Seçilenleri Sil (d)"
                  className="p-1 text-[#f38ba8] hover:scale-110 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Save button on larger screens */}
          {onOpenSaveModal && (
            <button
              type="button"
              onClick={onOpenSaveModal}
              title="Çalma Listesini Kaydet"
              className="hidden lg:flex p-2 text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
            </button>
          )}

          {/* Volume Control Box (Desktop & Tablet) */}
          <div
            className="hidden sm:flex items-center gap-2 bg-[#181825] px-2.5 py-1.5 rounded-xl border border-[#313244]"
            onWheel={handleVolumeWheel}
            title="Ses seviyesini ayarlayın (Mouse tekerleği desteklenir)"
          >
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              className="text-[#a6adc8] hover:text-[#cdd6f4] transition-colors"
            >
              {isMuted || status.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#f38ba8]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#fab387]" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : status.volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-16 md:w-20 lg:w-24 accent-[#fab387] bg-[#313244] h-1.5 rounded-lg cursor-pointer"
            />

            <span className="text-[11px] font-mono text-[#a6adc8] w-7 text-right select-none">
              {isMuted ? '0%' : `${status.volume}%`}
            </span>
          </div>

          {/* Mobile Right Controls (Prev, Play, Next) */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 text-[#cdd6f4] hover:text-[#fab387]"
              title="Önceki"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={isPlaying ? onPause : onPlay}
              className="w-9 h-9 rounded-full bg-[#fab387] text-[#11111b] flex items-center justify-center shadow-md active:scale-95"
              title={isPlaying ? 'Duraklat' : 'Oynat'}
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
              className="p-1.5 text-[#cdd6f4] hover:text-[#fab387]"
              title="Sonraki"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
