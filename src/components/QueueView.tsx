import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Song, PlaybackState } from '../types';
import { formatTime } from '../utils/formatters';
import {
  Play,
  Pause,
  Heart,
  Trash2,
  ListPlus,
  CheckSquare,
  Square as SquareIcon,
  FolderOpen,
  Crosshair
} from 'lucide-react';

interface QueueViewProps {
  queue: Song[];
  currentIndex: number;
  playbackState: PlaybackState;
  selectedIds: Set<string>;
  onSelectSong: (id: string, multiSelect?: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPlaySongAt: (index: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onRemoveSong: (id: string) => void;
  onQueueNextSong: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onGoToLibrary: () => void;
}

const ROW_HEIGHT = 50; // Fixed row height in pixels for virtual calculations
const OVERSCAN = 12; // Extra buffer rows above and below visible area

interface QueueRowProps {
  song: Song;
  idx: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isSelected: boolean;
  onSelectSong: (id: string, multiSelect?: boolean) => void;
  onPlaySongAt: (index: number) => void;
  onToggleRowPlayback: (idx: number, e?: React.MouseEvent) => void;
  onToggleFavorite: (id: string) => void;
  onQueueNextSong: (id: string) => void;
  onRemoveSong: (id: string) => void;
}

const QueueRow: React.FC<QueueRowProps> = React.memo(
  ({
    song,
    idx,
    isCurrent,
    isPlaying,
    isSelected,
    onSelectSong,
    onPlaySongAt,
    onToggleRowPlayback,
    onToggleFavorite,
    onQueueNextSong,
    onRemoveSong,
  }) => {
    return (
      <tr
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
          onSelectSong(song.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        onDoubleClick={() => onPlaySongAt(idx)}
        className={`group transition-colors cursor-pointer select-none h-[50px] ${
          isCurrent
            ? 'bg-[#fab387]/15 hover:bg-[#fab387]/20 border-l-4 border-[#fab387]'
            : isSelected
            ? 'bg-[#cba6f7]/10 hover:bg-[#cba6f7]/15 border-l-4 border-[#cba6f7]'
            : 'hover:bg-[#313244]/40 border-l-4 border-transparent'
        }`}
      >
        {/* Checkbox */}
        <td className="py-2.5 px-3 text-center w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectSong(song.id)}
            className="rounded accent-[#fab387] w-4 h-4 cursor-pointer"
          />
        </td>

        {/* Status / Track # / Animated EQ & Play Button */}
        <td className="py-2.5 px-3 text-center w-12">
          <button
            type="button"
            onClick={(e) => onToggleRowPlayback(idx, e)}
            className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto hover:bg-[#313244] transition-all group/btn"
            title={isPlaying ? 'Duraklat' : isCurrent ? 'Oynat' : 'Bu Parçayı Çal'}
          >
            {isPlaying ? (
              <>
                <div className="flex items-end justify-center gap-0.5 h-3.5 w-3.5 group-hover/btn:hidden">
                  <span className="w-0.5 bg-[#a6e3a1] rounded-full animate-eq-1" />
                  <span className="w-0.5 bg-[#fab387] rounded-full animate-eq-2" />
                  <span className="w-0.5 bg-[#cba6f7] rounded-full animate-eq-3" />
                </div>
                <Pause className="w-3.5 h-3.5 text-[#fab387] fill-current hidden group-hover/btn:block" />
              </>
            ) : isCurrent ? (
              <Play className="w-3.5 h-3.5 text-[#fab387] fill-current" />
            ) : (
              <>
                <span className="text-xs text-[#6c7086] group-hover:hidden font-mono">
                  {idx + 1}
                </span>
                <Play className="w-3.5 h-3.5 text-[#fab387] fill-current hidden group-hover:block" />
              </>
            )}
          </button>
        </td>

        {/* Title & Mobile Artist Info */}
        <td className="py-2.5 px-4 min-w-0 max-w-[240px] sm:max-w-none">
          <div className="flex flex-col min-w-0">
            <span
              className={`font-semibold text-sm truncate ${
                isCurrent ? 'text-[#fab387]' : 'text-[#cdd6f4]'
              }`}
            >
              {song.title}
            </span>
            <span className="text-xs text-[#a6adc8] md:hidden truncate">
              {song.artist} • {song.album}
            </span>
          </div>
        </td>

        {/* Artist (Desktop) */}
        <td className="py-2.5 px-4 text-[#a6adc8] hidden md:table-cell truncate max-w-[200px]">
          {song.artist}
        </td>

        {/* Album (Desktop) */}
        <td className="py-2.5 px-4 text-[#89b4fa]/80 hidden lg:table-cell truncate max-w-[200px]">
          {song.album}
        </td>

        {/* Duration */}
        <td className="py-2.5 px-4 text-right font-mono text-xs text-[#a6adc8] w-20">
          {formatTime(song.duration)}
        </td>

        {/* Actions */}
        <td className="py-2.5 px-3 text-center w-28">
          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => onToggleRowPlayback(idx, e)}
              title={isPlaying ? 'Duraklat' : 'Çal'}
              className={`p-1.5 rounded-lg transition-colors ${
                isCurrent
                  ? 'text-[#fab387] hover:bg-[#fab387]/20'
                  : 'text-[#6c7086] hover:text-[#fab387] hover:bg-[#313244]'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(song.id);
              }}
              title={song.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              className={`p-1.5 rounded-lg transition-colors ${
                song.isFavorite ? 'text-[#f38ba8]' : 'text-[#6c7086] hover:text-[#f38ba8]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-[#f38ba8]' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQueueNextSong(song.id);
              }}
              title="Sıradaki Parça Yap"
              className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#fab387] hover:bg-[#313244] transition-colors"
            >
              <ListPlus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSong(song.id);
              }}
              title="Kuyruktan Çıkar"
              className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#f38ba8] hover:bg-[#313244] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) => {
    return (
      prev.song.id === next.song.id &&
      prev.song.title === next.song.title &&
      prev.song.artist === next.song.artist &&
      prev.song.album === next.song.album &&
      prev.song.duration === next.song.duration &&
      prev.song.isFavorite === next.song.isFavorite &&
      prev.idx === next.idx &&
      prev.isCurrent === next.isCurrent &&
      prev.isPlaying === next.isPlaying &&
      prev.isSelected === next.isSelected
    );
  }
);

QueueRow.displayName = 'QueueRow';

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  currentIndex,
  playbackState,
  selectedIds,
  onSelectSong,
  onSelectAll,
  onClearSelection,
  onPlaySongAt,
  onPlay,
  onPause,
  onRemoveSong,
  onQueueNextSong,
  onToggleFavorite,
  onGoToLibrary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // Memoize total duration to prevent expensive iterations on every render
  const totalDuration = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < queue.length; i++) {
      sum += queue[i].duration || 0;
    }
    return sum;
  }, [queue]);

  const allSelected = queue.length > 0 && selectedIds.size === queue.length;

  // Track container height for virtualization
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Optimized scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const top = containerRef.current.scrollTop;
    requestAnimationFrame(() => {
      setScrollTop(top);
    });
  }, []);

  // Scroll to active song handler
  const scrollToCurrentSong = useCallback(() => {
    if (!containerRef.current || currentIndex < 0 || currentIndex >= queue.length) return;
    const targetTop = Math.max(0, currentIndex * ROW_HEIGHT - containerHeight / 3);
    containerRef.current.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  }, [currentIndex, queue.length, containerHeight]);

  const handleToggleRowPlayback = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (idx === currentIndex) {
        if (playbackState === 'play') {
          if (onPause) onPause();
        } else {
          if (onPlay) onPlay();
          else onPlaySongAt(idx);
        }
      } else {
        onPlaySongAt(idx);
      }
    },
    [currentIndex, playbackState, onPause, onPlay, onPlaySongAt]
  );

  // Determine virtualization slice
  const isVirtual = queue.length > 50;
  const startIndex = isVirtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const endIndex = isVirtual
    ? Math.min(queue.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN)
    : queue.length;

  const visibleQueue = useMemo(() => {
    if (!isVirtual) return queue;
    return queue.slice(startIndex, endIndex);
  }, [isVirtual, queue, startIndex, endIndex]);

  const topSpacerHeight = isVirtual ? startIndex * ROW_HEIGHT : 0;
  const bottomSpacerHeight = isVirtual ? Math.max(0, (queue.length - endIndex) * ROW_HEIGHT) : 0;

  return (
    <section className="bg-[#1e1e2e]/90 backdrop-blur-md rounded-2xl border border-[#313244] overflow-hidden shadow-xl flex flex-col">
      {/* Queue Header & Batch Bar */}
      <div className="px-4 py-3 sm:px-6 border-b border-[#313244] flex flex-wrap items-center justify-between gap-3 bg-[#181825]/60 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-bold text-[#cdd6f4] flex items-center gap-2">
            <span>📻 Çalma Sırası</span>
            <span className="text-xs font-normal text-[#a6adc8] bg-[#313244] px-2 py-0.5 rounded-full font-mono">
              {queue.length} parça • {formatTime(totalDuration)}
            </span>
          </h3>

          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] border border-[#cba6f7]/30 animate-pulse">
              {selectedIds.size} seçildi
            </span>
          )}
        </div>

        {/* Selection Tools & Fast Jump */}
        <div className="flex items-center gap-2">
          {queue.length > 15 && currentIndex >= 0 && (
            <button
              type="button"
              onClick={scrollToCurrentSong}
              className="text-xs text-[#fab387] hover:text-[#f9e2af] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#fab387]/30 bg-[#fab387]/10 hover:bg-[#fab387]/20 transition-all font-medium"
              title="Şu an çalan parçaya odaklan"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çalana Odaklan (#{currentIndex + 1})</span>
            </button>
          )}

          {queue.length > 0 && (
            <button
              type="button"
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="text-xs text-[#a6adc8] hover:text-[#cdd6f4] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#313244] hover:bg-[#313244] transition-all"
            >
              {allSelected ? (
                <>
                  <SquareIcon className="w-3.5 h-3.5 text-[#fab387]" />
                  <span>Seçimi Kaldır</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[#fab387]" />
                  <span>Tümünü Seç</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <div className="py-20 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#313244]/50 flex items-center justify-center text-3xl">
            🌱
          </div>
          <div className="max-w-sm">
            <p className="text-base font-semibold text-[#cdd6f4]">
              Çalma sırası şu an boş
            </p>
            <p className="text-sm text-[#a6adc8] mt-1">
              MPD kütüphanenizden veya radyo akışlarından parçaları sıraya ekleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToLibrary}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fab387] hover:bg-[#f9e2af] text-[#11111b] text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Kütüphaneye Git</span>
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-230px)] min-h-[380px] relative scroll-smooth"
        >
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#181825] shadow-sm">
              <tr className="border-b border-[#313244] text-[11px] uppercase tracking-wider text-[#6c7086] font-semibold select-none">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-12 text-center">Durum</th>
                <th className="py-2.5 px-4">Başlık / Parça</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Sanatçı</th>
                <th className="py-2.5 px-4 hidden lg:table-cell">Albüm</th>
                <th className="py-2.5 px-4 w-20 text-right">Süre</th>
                <th className="py-2.5 px-3 w-28 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/50">
              {/* Virtual Top Spacer */}
              {topSpacerHeight > 0 && (
                <tr style={{ height: `${topSpacerHeight}px` }}>
                  <td colSpan={7} className="p-0 border-none pointer-events-none" />
                </tr>
              )}

              {visibleQueue.map((song, localIdx) => {
                const actualIdx = isVirtual ? startIndex + localIdx : localIdx;
                const isCurrent = actualIdx === currentIndex;
                const isSelected = selectedIds.has(song.id);
                const isPlaying = isCurrent && playbackState === 'play';

                return (
                  <QueueRow
                    key={song.id || `track-${actualIdx}`}
                    song={song}
                    idx={actualIdx}
                    isCurrent={isCurrent}
                    isPlaying={isPlaying}
                    isSelected={isSelected}
                    onSelectSong={onSelectSong}
                    onPlaySongAt={onPlaySongAt}
                    onToggleRowPlayback={handleToggleRowPlayback}
                    onToggleFavorite={onToggleFavorite}
                    onQueueNextSong={onQueueNextSong}
                    onRemoveSong={onRemoveSong}
                  />
                );
              })}

              {/* Virtual Bottom Spacer */}
              {bottomSpacerHeight > 0 && (
                <tr style={{ height: `${bottomSpacerHeight}px` }}>
                  <td colSpan={7} className="p-0 border-none pointer-events-none" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
