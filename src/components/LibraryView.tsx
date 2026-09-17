import React from 'react';
import { Song, LibraryFolder } from '../types';
import { formatTime } from '../utils/formatters';
import {
  Folder,
  FolderOpen,
  CornerLeftUp,
  Plus,
  Play,
  Music,
  Check,
  Search,
  Sparkles
} from 'lucide-react';

interface LibraryViewProps {
  currentPath: string;
  folders: Record<string, LibraryFolder>;
  searchQuery: string;
  allSongs: Song[];
  onNavigateTo: (path: string) => void;
  onAddSongToQueue: (song: Song) => void;
  onPlaySongNow: (song: Song) => void;
  onAddAllToQueue: (songs: Song[]) => void;
  onAddFolderToQueue: (folderPath: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  currentPath,
  folders,
  searchQuery,
  allSongs,
  onNavigateTo,
  onAddSongToQueue,
  onPlaySongNow,
  onAddAllToQueue,
  onAddFolderToQueue,
}) => {
  const currentFolder = folders[currentPath] || folders[''] || {
    path: currentPath,
    name: currentPath ? currentPath.split('/').pop() || currentPath : 'Kütüphane Ana Dizini',
    parentPath: currentPath ? currentPath.split('/').slice(0, -1).join('/') : null,
    subFolders: [],
    songs: [],
  };

  // Breadcrumbs calculation
  const pathParts = currentPath ? currentPath.split('/') : [];
  const breadcrumbItems = [
    { label: 'Kütüphane Ana Dizini', path: '' },
    ...pathParts.map((part, index) => ({
      label: part,
      path: pathParts.slice(0, index + 1).join('/'),
    })),
  ];

  // If search query is active, filter all songs
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? allSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <section className="bg-[#1e1e2e]/90 backdrop-blur-md rounded-2xl border border-[#313244] overflow-hidden shadow-xl flex flex-col">
      {/* Header & Breadcrumbs Bar */}
      <div className="px-4 py-3.5 sm:px-6 border-b border-[#313244] flex flex-wrap items-center justify-between gap-3 bg-[#181825]/50">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <FolderOpen className="w-4 h-4 text-[#fab387] shrink-0" />
          {breadcrumbItems.map((item, idx) => (
            <React.Fragment key={item.path}>
              {idx > 0 && <span className="text-[#6c7086]">/</span>}
              <button
                type="button"
                onClick={() => onNavigateTo(item.path)}
                className={`font-semibold hover:underline transition-colors ${
                  idx === breadcrumbItems.length - 1
                    ? 'text-[#fab387]'
                    : 'text-[#a6adc8] hover:text-[#cdd6f4]'
                }`}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Button: Add All */}
        {((!isSearching && currentFolder?.songs?.length > 0) || (isSearching && searchResults.length > 0)) && (
          <button
            type="button"
            onClick={() => onAddAllToQueue(isSearching ? searchResults : currentFolder.songs)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#a6e3a1]/20 hover:bg-[#a6e3a1]/30 text-[#a6e3a1] border border-[#a6e3a1]/30 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hepsini Kuyruğa Ekle ({isSearching ? searchResults.length : currentFolder.songs.length})</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex flex-col gap-4">
        {/* Search Results Display */}
        {isSearching ? (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-[#a6adc8]">
              <Search className="w-3.5 h-3.5 text-[#fab387]" />
              <span>
                "{searchQuery}" için <strong>{searchResults.length}</strong> sonuç bulundu
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-[#a6adc8]">
                <p>Eşleşen parça veya albüm bulunamadı.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#313244]/60">
                {searchResults.map((song) => (
                  <div
                    key={song.id}
                    onDoubleClick={() => onPlaySongNow(song)}
                    className="py-2.5 px-3 rounded-xl hover:bg-[#313244]/40 flex items-center justify-between gap-3 group transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Music className="w-4 h-4 text-[#fab387] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#cdd6f4] group-hover:text-[#fab387] truncate transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-[#a6adc8] truncate">
                          {song.artist} • {song.album}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-[#a6adc8]">
                        {formatTime(song.duration)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySongNow(song);
                        }}
                        title="Hemen Çal"
                        className="p-1.5 rounded-lg bg-[#fab387] text-[#11111b] hover:bg-[#f9e2af] transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddSongToQueue(song);
                        }}
                        title="Kuyruğa Ekle"
                        className="p-1.5 rounded-lg bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Folder View */
          <div className="flex flex-col gap-4">
            {/* Back Button (if not in root) */}
            {currentFolder.parentPath !== null && (
              <button
                type="button"
                onClick={() => onNavigateTo(currentFolder.parentPath || '')}
                className="inline-flex items-center gap-2 text-sm text-[#fab387] hover:text-[#f9e2af] font-semibold py-1.5 px-3 rounded-xl bg-[#313244]/40 hover:bg-[#313244] w-fit border border-[#45475a]/40 transition-all"
              >
                <CornerLeftUp className="w-4 h-4" />
                <span>.. Üst Klasöre Dön</span>
              </button>
            )}

            {/* Subfolders Grid */}
            {currentFolder.subFolders.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#6c7086] mb-2.5">
                  Klasörler
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentFolder.subFolders.map((subPath) => {
                    const folderName = subPath.split('/').pop() || subPath;
                    return (
                      <div
                        key={subPath}
                        className="p-3.5 rounded-xl bg-[#181825] hover:bg-[#313244] border border-[#313244] hover:border-[#fab387]/40 flex items-center justify-between gap-3 group transition-all"
                      >
                        <div
                          onClick={() => onNavigateTo(subPath)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-[#fab387]/10 text-[#fab387] group-hover:bg-[#fab387] group-hover:text-[#11111b] transition-colors">
                            <Folder className="w-5 h-5 fill-current" />
                          </div>
                          <span className="font-semibold text-sm text-[#cdd6f4] group-hover:text-[#fab387] truncate transition-colors">
                            {folderName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddFolderToQueue(subPath);
                            }}
                            title={`"${folderName}" klasörünü sıraya ekle`}
                            className="p-1.5 rounded-lg bg-[#313244] hover:bg-[#fab387] text-[#cdd6f4] hover:text-[#11111b] transition-all flex items-center gap-1 text-xs font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Sıraya Ekle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateTo(subPath)}
                            title="Klasöre Git"
                            className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Songs in this folder */}
            {currentFolder.songs.length > 0 && (
              <div className="mt-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#6c7086] mb-2.5">
                  Parçalar ({currentFolder.songs.length})
                </h4>
                <div className="divide-y divide-[#313244]/60">
                  {currentFolder.songs.map((song, i) => (
                    <div
                      key={song.id}
                      onDoubleClick={() => onPlaySongNow(song)}
                      className="py-2.5 px-3 rounded-xl hover:bg-[#313244]/40 flex items-center justify-between gap-3 group transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-[#6c7086] w-6 text-center">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#cdd6f4] group-hover:text-[#fab387] truncate transition-colors">
                            {song.title}
                          </p>
                          <p className="text-xs text-[#a6adc8] truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-[#a6adc8]">
                          {formatTime(song.duration)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySongNow(song);
                          }}
                          title="Hemen Çal"
                          className="p-1.5 rounded-lg bg-[#fab387] text-[#11111b] hover:bg-[#f9e2af] transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddSongToQueue(song);
                          }}
                          title="Kuyruğa Ekle"
                          className="p-1.5 rounded-lg bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Folder State */}
            {currentFolder.subFolders.length === 0 && currentFolder.songs.length === 0 && (
              <div className="py-12 text-center text-[#a6adc8]">
                <p>Bu klasörde parça veya alt klasör bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
