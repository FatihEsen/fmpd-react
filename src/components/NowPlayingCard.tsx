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
  Trash2,
  XCircle,
  Save,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  StepForward,
} from 'lucide-react';

interface NowPlayingCardProps {
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
  onBatchDelete: () => void;
  onBatchMoveUp: () => void;
  onBatchMoveDown: () => void;
  onBatchQueueNext: () => void;
  onClearQueue: () => void;
  onOpenSaveModal: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
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
  onClearQueue,
  onOpenSaveModal,
  onVolumeChange,
  onToggleMute,
  isMuted,
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

  // Mouse wheel on seekbar to jump +/- 5s
  const handleSeekbarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!currentSong || currentSong.duration <= 0) return;
    const delta = e.deltaY < 0 ? 5 : -5;
    const newTime = Math.max(0, Math.min(currentSong.duration, status.elapsed + delta));
    onSeek(newTime);
  };

  // Mouse wheel on volume to adjust +/- 3%
  const handleVolumeWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 3 : -3;
    const newVol = Math.max(0, Math.min(100, status.volume + delta));
    onVolumeChange(newVol);
  };

  const progressPercent = currentSong && currentSong.duration > 0
    ? Math.min(100, Math.max(0, (status.elapsed / currentSong.duration) * 100))
    : 0;

  return (
    <section className="bg-[#1e1e2e]/90 backdrop-blur-md rounded-2xl border border-[#313244] p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#cba6f7]/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[#fab387]/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Left: Vinyl Disk & Badge */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#11111b] border-4 border-[#313244] shadow-2xl flex items-center justify-center select-none">
            {/* Vinyl record grooves */}
            <div className="absolute inset-2 rounded-full border border-[#45475a]/30 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-[#45475a]/20 pointer-events-none" />
            <div className="absolute inset-7 rounded-full border border-[#45475a]/20 pointer-events-none" />

            {/* Rotating center piece */}
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-tr from-[#fab387] to-[#cba6f7] flex items-center justify-center shadow-md text-xl ${
                isPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-spin-paused'
              }`}
            >
              <span>🌱</span>
            </div>
          </div>

          <span className="text-[11px] font-mono tracking-wider font-semibold text-[#fab387] bg-[#313244]/80 px-2.5 py-0.5 rounded-full border border-[#fab387]/20">
            MPD 6600
          </span>
        </div>

        {/* Center & Right: Track Details, Progress & Controls */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {/* Track Info */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#cdd6f4] truncate tracking-tight">
                {currentSong ? currentSong.title : 'Parça Seçilmedi'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-[#a6adc8] mt-0.5 truncate">
                <span className="font-semibold text-[#fab387]">
                  {currentSong ? currentSong.artist : 'Sanatçı Yok'}
                </span>
                <span className="text-[#6c7086]">•</span>
                <span className="text-[#bac2de] truncate">
                  {currentSong ? currentSong.album : 'Albüm Yok'}
                </span>
              </div>
            </div>

            {/* High-res Audio Format Badge */}
            {status.audioFormat && (
              <span className="self-start sm:self-auto text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#313244] text-[#a6e3a1] border border-[#a6e3a1]/20">
                {status.audioFormat}
              </span>
            )}
          </div>

          {/* Interactive Seekbar */}
          <div className="flex flex-col gap-1.5 select-none" onWheel={handleSeekbarWheel}>
            <div
              ref={seekbarRef}
              onClick={handleSeekbarClick}
              className="h-2.5 w-full bg-[#313244] rounded-full cursor-pointer relative overflow-hidden group hover:h-3 transition-all"
            >
              <div
                className="h-full bg-gradient-to-r from-[#fab387] via-[#cba6f7] to-[#a6e3a1] rounded-full transition-all duration-150 relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>

            {/* Time labels & Inline Mode Toggles */}
            <div className="flex items-center justify-between text-xs text-[#a6adc8] pt-0.5">
              <span className="font-mono text-[13px] font-medium text-[#cdd6f4]">
                {formatTime(status.elapsed)} / {formatTime(currentSong?.duration || 0)}
              </span>

              {/* Mode Toggles */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleRandom}
                  title="Rastgele (z)"
                  className={`p-1.5 rounded-lg transition-all ${
                    status.random
                      ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                      : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onToggleRepeat}
                  title="Tekrar (r)"
                  className={`p-1.5 rounded-lg transition-all ${
                    status.repeat
                      ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                      : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onToggleSingle}
                  title="Tek Şarkı (y)"
                  className={`p-1.5 rounded-lg transition-all ${
                    status.single
                      ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                      : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
                  }`}
                >
                  <Repeat1 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onToggleConsume}
                  title="Tüket (x) - Çalınanı kuyruktan sil"
                  className={`p-1.5 rounded-lg transition-all ${
                    status.consume
                      ? 'bg-[#fab387] text-[#11111b] font-bold shadow-sm'
                      : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                </button>

                {currentSong && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(currentSong.id)}
                    title="Favorilere Ekle"
                    className={`p-1.5 rounded-lg transition-all ${
                      currentSong.isFavorite
                        ? 'text-[#f38ba8] bg-[#f38ba8]/20'
                        : 'text-[#a6adc8] hover:text-[#f38ba8] hover:bg-[#313244]'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${currentSong.isFavorite ? 'fill-[#f38ba8]' : ''}`}
                    />
                  </button>
                )}

                <span className="w-px h-3.5 bg-[#45475a] mx-1" />

                <button
                  type="button"
                  onClick={onBatchDelete}
                  disabled={selectedCount === 0}
                  title={`Seçilenleri Sil (d) [${selectedCount} seçili]`}
                  className={`p-1.5 rounded-lg transition-all ${
                    selectedCount > 0
                      ? 'text-[#f38ba8] hover:bg-[#f38ba8]/20 cursor-pointer'
                      : 'text-[#585b70] cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onClearQueue}
                  title="Kuyruğu Temizle (c)"
                  className="p-1.5 rounded-lg text-[#f38ba8] hover:bg-[#f38ba8]/20 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onOpenSaveModal}
                  title="Listeyi Kaydet"
                  className="p-1.5 rounded-lg text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Main Transport & Volume Slider */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Center Controls */}
            <div className="flex items-center gap-2">
              {/* Batch Move Up */}
              <button
                type="button"
                onClick={onBatchMoveUp}
                disabled={selectedCount === 0}
                title="Seçilenleri Yukarı Taşı (Shift+K)"
                className={`p-2 rounded-xl border border-[#313244] transition-all ${
                  selectedCount > 0
                    ? 'text-[#cdd6f4] hover:bg-[#313244] hover:border-[#45475a]'
                    : 'text-[#45475a] border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* Queue Next */}
              <button
                type="button"
                onClick={onBatchQueueNext}
                disabled={selectedCount === 0}
                title="Sıradaki Yap (ö / ⏭)"
                className={`p-2 rounded-xl border border-[#313244] transition-all ${
                  selectedCount > 0
                    ? 'text-[#fab387] hover:bg-[#313244] hover:border-[#fab387]/50'
                    : 'text-[#45475a] border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <StepForward className="w-4 h-4" />
              </button>

              {/* Batch Move Down */}
              <button
                type="button"
                onClick={onBatchMoveDown}
                disabled={selectedCount === 0}
                title="Seçilenleri Aşağı Taşı (Shift+J)"
                className={`p-2 rounded-xl border border-[#313244] transition-all ${
                  selectedCount > 0
                    ? 'text-[#cdd6f4] hover:bg-[#313244] hover:border-[#45475a]'
                    : 'text-[#45475a] border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <span className="w-px h-6 bg-[#313244] mx-1" />

              {/* Prev */}
              <button
                type="button"
                onClick={onPrev}
                title="Önceki Parça (B)"
                className="p-2.5 rounded-xl text-[#cdd6f4] hover:bg-[#313244] transition-all active:scale-95"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause Main Button */}
              <button
                type="button"
                onClick={isPlaying ? onPause : onPlay}
                title="Oynat / Duraklat (Space)"
                className="w-12 h-12 rounded-2xl bg-[#fab387] hover:bg-[#f9e2af] text-[#11111b] flex items-center justify-center shadow-lg hover:shadow-[#fab387]/20 transition-all active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={onStop}
                title="Durdur"
                className="p-2.5 rounded-xl text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={onNext}
                title="Sonraki Parça (N)"
                className="p-2.5 rounded-xl text-[#cdd6f4] hover:bg-[#313244] transition-all active:scale-95"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Volume Control */}
            <div
              className="flex items-center gap-2.5 bg-[#181825] px-3.5 py-2 rounded-xl border border-[#313244] w-full sm:w-auto"
              onWheel={handleVolumeWheel}
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
                className="w-24 sm:w-28 accent-[#fab387] bg-[#313244] h-1.5 rounded-lg cursor-pointer"
                title={`Ses: ${isMuted ? 0 : status.volume}%`}
              />

              <span className="text-xs font-mono text-[#a6adc8] w-8 text-right select-none">
                {isMuted ? '0%' : `${status.volume}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
