import React, { useRef, useState } from 'react';
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
  XCircle,
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
  onClearQueue?: () => void;
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
  onClearQueue,
  onOpenSaveModal,
  onVolumeChange,
  onToggleMute,
  isMuted,
  onScrollToTop,
}) => {
  const seekbarRef = useRef<HTMLDivElement>(null);
  const [mobileVolumeOpen, setMobileVolumeOpen] = useState<boolean>(false);
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#181825]/95 backdrop-blur-xl border-t border-[#313244] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] transition-all select-none"
    >
      {/* Top Interactive Progress / Seekbar */}
      <div
        ref={seekbarRef}
        onClick={handleSeekbarClick}
        onWheel={handleSeekbarWheel}
        className="w-full h-1.5 sm:h-2 bg-[#313244] cursor-pointer relative group hover:h-2.5 transition-all"
        title="İlerlemek için tıklayın veya mouse tekerleğiyle sarın"
      >
        <div
          className="h-full bg-gradient-to-r from-[#fab387] via-[#cba6f7] to-[#a6e3a1] transition-all duration-150 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col gap-2">
        {/* ================= ROW 1: NOW PLAYING INFO, TIME & VOLUME ================= */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          {/* Left: Vinyl Disc, Title, Artist, Format Badge & Favorite */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Spinning Vinyl Disk Thumbnail */}
            <div
              onClick={onScrollToTop}
              title={currentSong ? `${currentSong.title} - ${currentSong.artist}` : 'Oynatıcı'}
              className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#11111b] border-2 border-[#313244] shadow-md flex items-center justify-center shrink-0 cursor-pointer hover:border-[#fab387]/50 transition-colors"
            >
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-[#fab387] to-[#cba6f7] flex items-center justify-center shadow-sm text-[10px] sm:text-xs ${
                  isPlaying ? 'animate-vinyl-spin' : 'animate-vinyl-spin-paused'
                }`}
              >
                <span>🌱</span>
              </div>
            </div>

            {/* Titles */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4
                  onClick={onScrollToTop}
                  className="text-xs sm:text-sm font-bold text-[#cdd6f4] truncate hover:text-[#fab387] cursor-pointer transition-colors"
                  title={currentSong ? currentSong.title : 'Parça Seçilmedi'}
                >
                  {currentSong ? currentSong.title : 'Parça Seçilmedi'}
                </h4>

                {status.audioFormat && (
                  <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#313244] text-[#a6e3a1] border border-[#a6e3a1]/20 shrink-0">
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
                    <span className="text-[#bac2de] truncate">{currentSong.album}</span>
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
                className="p-1.5 text-[#a6adc8] hover:text-[#f38ba8] hover:bg-[#313244]/60 rounded-xl transition-all shrink-0"
              >
                <Heart
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    currentSong.isFavorite ? 'fill-[#f38ba8] text-[#f38ba8]' : ''
                  }`}
                />
              </button>
            )}
          </div>

          {/* Right: Elapsed/Total Duration & Volume Control */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Time Display */}
            <div className="text-[11px] sm:text-xs font-mono text-[#a6adc8] bg-[#11111b]/80 px-2 py-1 rounded-lg border border-[#313244] flex items-center gap-1">
              <span className="text-[#fab387] font-semibold">{formatTime(status.elapsed)}</span>
              <span className="text-[#6c7086]">/</span>
              <span>{formatTime(currentSong?.duration || 0)}</span>
            </div>

            {/* Volume Control Box (Desktop & Tablet) */}
            <div
              className="hidden sm:flex items-center gap-2 bg-[#11111b]/80 px-2.5 py-1 rounded-xl border border-[#313244]"
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

              <span className="text-[11px] font-mono text-[#a6adc8] w-8 text-right select-none">
                {isMuted ? '0%' : `${status.volume}%`}
              </span>
            </div>

            {/* Mobile Volume Toggle & Inline Popover */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setMobileVolumeOpen(!mobileVolumeOpen)}
                title="Ses Seviyesi"
                className="p-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-[#a6adc8] hover:text-[#fab387]"
              >
                {isMuted || status.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#f38ba8]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#fab387]" />
                )}
              </button>

              {mobileVolumeOpen && (
                <div className="absolute bottom-10 right-0 bg-[#1e1e2e] border border-[#313244] shadow-2xl p-2.5 rounded-xl flex items-center gap-2 z-50 min-w-[170px]">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="text-xs text-[#fab387]"
                  >
                    {isMuted ? 'Aç' : 'Kapat'}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : status.volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-24 accent-[#fab387] bg-[#313244] h-1.5 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#a6adc8]">
                    {status.volume}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= ROW 2: DEDICATED CONTROLS & ACTION ROW ================= */}
        {/* Contains ALL buttons from the old Now Playing block */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#313244]/50">
          {/* Group 1: MPD Playback Modes (Shuffle, Repeat, Single, Consume) */}
          <div className="flex items-center gap-1 bg-[#11111b]/60 p-1 rounded-xl border border-[#313244]/60">
            {/* Random / Shuffle */}
            <button
              type="button"
              onClick={onToggleRandom}
              title="Karışık Çal (z)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                status.random
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-xs'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Karışık</span>
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={onToggleRepeat}
              title="Tekrar Modu (r)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                status.repeat
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-xs'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tekrar</span>
            </button>

            {/* Single */}
            <button
              type="button"
              onClick={onToggleSingle}
              title="Tek Şarkı Tekrarı (y)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                status.single
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-xs'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Repeat1 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tek Şarkı</span>
            </button>

            {/* Consume */}
            <button
              type="button"
              onClick={onToggleConsume}
              title="Tüket Modu (x - Çalınan şarkıyı kuyruktan sil)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                status.consume
                  ? 'bg-[#fab387] text-[#11111b] font-bold shadow-xs'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tüket</span>
            </button>
          </div>

          {/* Group 2: Primary Transport Controls (Prev, Play/Pause, Stop, Next) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Prev Track */}
            <button
              type="button"
              onClick={onPrev}
              title="Önceki Parça (b)"
              className="p-2 text-[#cdd6f4] hover:text-[#fab387] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              type="button"
              onClick={isPlaying ? onPause : onPlay}
              title="Oynat / Duraklat (Space)"
              className="h-9 px-4 sm:h-10 sm:px-5 rounded-full bg-[#fab387] hover:bg-[#f9e2af] text-[#11111b] font-bold flex items-center justify-center gap-1.5 shadow-lg hover:shadow-[#fab387]/30 transition-all active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span className="text-xs hidden sm:inline">Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span className="text-xs hidden sm:inline">Oynat</span>
                </>
              )}
            </button>

            {/* Stop */}
            <button
              type="button"
              onClick={onStop}
              title="Durdur"
              className="p-2 text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={onNext}
              title="Sonraki Parça (n)"
              className="p-2 text-[#cdd6f4] hover:text-[#fab387] hover:bg-[#313244] rounded-xl transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Group 3: Playlist & Queue Actions (Batch tools, Save, Clear) */}
          <div className="flex items-center gap-1.5">
            {/* Batch Selection Action Bar (Appears when items are selected) */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-1 bg-[#313244] px-2 py-1 rounded-xl border border-[#45475a]">
                <span className="text-xs text-[#fab387] font-bold px-1">
                  {selectedCount} seçili
                </span>
                {onBatchMoveUp && (
                  <button
                    type="button"
                    onClick={onBatchMoveUp}
                    title="Yukarı Taşı (Shift+K)"
                    className="p-1 hover:text-[#fab387] rounded transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {onBatchQueueNext && (
                  <button
                    type="button"
                    onClick={onBatchQueueNext}
                    title="Sıradaki Yap (ö)"
                    className="p-1 text-[#fab387] hover:scale-110 rounded transition-transform"
                  >
                    <StepForward className="w-3.5 h-3.5" />
                  </button>
                )}
                {onBatchMoveDown && (
                  <button
                    type="button"
                    onClick={onBatchMoveDown}
                    title="Aşağı Taşı (Shift+J)"
                    className="p-1 hover:text-[#fab387] rounded transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {onBatchDelete && (
                  <button
                    type="button"
                    onClick={onBatchDelete}
                    title="Seçilenleri Sil (d)"
                    className="p-1 text-[#f38ba8] hover:scale-110 rounded transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Save Playlist Button */}
            {onOpenSaveModal && (
              <button
                type="button"
                onClick={onOpenSaveModal}
                title="Çalma Listesini Kaydet"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] border border-[#313244] rounded-xl transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kaydet</span>
              </button>
            )}

            {/* Clear Queue Button */}
            {onClearQueue && (
              <button
                type="button"
                onClick={onClearQueue}
                title="Çalma Sırasını Temizle (c)"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#a6adc8] hover:text-[#f38ba8] hover:bg-[#313244] border border-[#313244] rounded-xl transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
