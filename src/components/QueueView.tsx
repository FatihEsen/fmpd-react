import React from 'react';
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
  Music2,
  FolderOpen
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
  const totalDuration = queue.reduce((acc, song) => acc + song.duration, 0);
  const allSelected = queue.length > 0 && selectedIds.size === queue.length;

  const handleToggleRowPlayback = (idx: number, e?: React.MouseEvent) => {
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
  };

  return (
    <section className="bg-[#1e1e2e]/90 backdrop-blur-md rounded-2xl border border-[#313244] overflow-hidden shadow-xl flex flex-col">
      {/* Queue Header & Batch Bar */}
      <div className="px-4 py-3.5 sm:px-6 border-b border-[#313244] flex flex-wrap items-center justify-between gap-3 bg-[#181825]/50">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-bold text-[#cdd6f4] flex items-center gap-2">
            <span>📻 Çalma Sırası</span>
            <span className="text-xs font-normal text-[#a6adc8] bg-[#313244] px-2 py-0.5 rounded-full">
              {queue.length} parça • {formatTime(totalDuration)}
            </span>
          </h3>

          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] border border-[#cba6f7]/30 animate-pulse">
              {selectedIds.size} seçildi
            </span>
          )}
        </div>

        {/* Selection Tools */}
        <div className="flex items-center gap-2">
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
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#313244]/50 flex items-center justify-center text-3xl">
            🌱
          </div>
          <div className="max-w-sm">
            <p className="text-base font-semibold text-[#cdd6f4]">
              Çalma sırası şu an boş
            </p>
            <p className="text-sm text-[#a6adc8] mt-1">
              Müzik kütüphanesinden sevdiğiniz Ghibli parçalarını veya albümleri sıraya ekleyin.
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#313244] text-[11px] uppercase tracking-wider text-[#6c7086] font-semibold select-none bg-[#11111b]/30">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-10 text-center">Durum</th>
                <th className="py-2.5 px-4">Başlık / Parça</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Sanatçı</th>
                <th className="py-2.5 px-4 hidden lg:table-cell">Albüm</th>
                <th className="py-2.5 px-4 w-20 text-right">Süre</th>
                <th className="py-2.5 px-3 w-28 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60">
              {queue.map((song, idx) => {
                const isCurrent = idx === currentIndex;
                const isSelected = selectedIds.has(song.id);
                const isPlaying = isCurrent && playbackState === 'play';

                return (
                  <tr
                    key={song.id}
                    onClick={(e) => {
                      // If clicking inside a button, don't toggle selection
                      if ((e.target as HTMLElement).closest('button')) return;
                      onSelectSong(song.id, e.shiftKey || e.ctrlKey || e.metaKey);
                    }}
                    onDoubleClick={() => onPlaySongAt(idx)}
                    className={`group transition-colors cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-[#fab387]/10 hover:bg-[#fab387]/15'
                        : isSelected
                        ? 'bg-[#cba6f7]/10 hover:bg-[#cba6f7]/15'
                        : 'hover:bg-[#313244]/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectSong(song.id)}
                        className="rounded accent-[#fab387] w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Status / Track # / Animated EQ & Play Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleRowPlayback(idx, e)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto hover:bg-[#313244] transition-all group/btn"
                        title={
                          isPlaying
                            ? 'Duraklat'
                            : isCurrent
                            ? 'Oynat'
                            : 'Bu Parçayı Çal'
                        }
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
                            <span className="text-xs text-[#6c7086] group-hover:hidden">
                              {idx + 1}
                            </span>
                            <Play className="w-3.5 h-3.5 text-[#fab387] fill-current hidden group-hover:block" />
                          </>
                        )}
                      </button>
                    </td>

                    {/* Title & Mobile Artist Info */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-sm line-clamp-1 ${
                            isCurrent ? 'text-[#fab387]' : 'text-[#cdd6f4]'
                          }`}
                        >
                          {song.title}
                        </span>
                        <span className="text-xs text-[#a6adc8] md:hidden line-clamp-1">
                          {song.artist} • {song.album}
                        </span>
                      </div>
                    </td>

                    {/* Artist (Desktop) */}
                    <td className="py-3 px-4 text-[#a6adc8] hidden md:table-cell truncate">
                      {song.artist}
                    </td>

                    {/* Album (Desktop) */}
                    <td className="py-3 px-4 text-[#89b4fa]/80 hidden lg:table-cell truncate">
                      {song.album}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-[#a6adc8]">
                      {formatTime(song.duration)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleToggleRowPlayback(idx, e)}
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
                            song.isFavorite
                              ? 'text-[#f38ba8]'
                              : 'text-[#6c7086] hover:text-[#f38ba8]'
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
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
