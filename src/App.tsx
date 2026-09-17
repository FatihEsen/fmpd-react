/**
 * FMPD - Catppuccin & Ghibli MPD Web Client
 * Modern React & TypeScript Rewrite
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  MpdStatus,
  TabType,
  MpdConfig,
  StreamItem,
  LibraryFolder,
} from './types';
import { INITIAL_STREAMS } from './data/streams';
import { AppHeader } from './components/AppHeader';
import { NowPlayingCard } from './components/NowPlayingCard';
import { QueueView } from './components/QueueView';
import { LibraryView } from './components/LibraryView';
import { StreamsView } from './components/StreamsView';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { AddStreamModal } from './components/modals/AddStreamModal';
import { SavePlaylistModal } from './components/modals/SavePlaylistModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { useMpdBridge } from './hooks/useMpdBridge';

export default function App() {
  // --- State ---
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState<TabType>('queue');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<Record<string, LibraryFolder>>({
    '': {
      path: '',
      name: 'Kütüphane Ana Dizini',
      parentPath: null,
      subFolders: [],
      songs: [],
    },
  });
  const [streams, setStreams] = useState<StreamItem[]>(INITIAL_STREAMS);

  // Modals
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [addStreamOpen, setAddStreamOpen] = useState<boolean>(false);
  const [savePlaylistOpen, setSavePlaylistOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isUpdatingDb, setIsUpdatingDb] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mute & Volume
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [savedVolume, setSavedVolume] = useState<number>(85);

  // Config
  const [config, setConfig] = useState<MpdConfig>({
    host: 'localhost',
    port: 6600,
    wsUrl: 'ws://localhost:8080/ws',
    connected: false,
  });

  const currentSong = queue[currentIndex] || null;

  const [status, setStatus] = useState<MpdStatus>({
    state: 'stop',
    songIndex: 0,
    songId: '',
    elapsed: 0,
    duration: 0,
    volume: 85,
    repeat: false,
    random: false,
    single: false,
    consume: false,
    bitRate: '',
    audioFormat: '',
    queueCount: 0,
  });

  // Show quick toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Native MPD Bridge integration hook
  const {
    bridgeConnected,
    isConnecting,
    connectBridge,
    sendMpdCommand,
    fetchQueue,
    fetchLibrary,
    fetchAllSongs,
  } = useMpdBridge(config, showToast);

  // Sync bridge state into config
  useEffect(() => {
    setConfig((prev) => ({ ...prev, connected: bridgeConnected }));
  }, [bridgeConnected]);

  // Sync queue from real MPD when connected
  useEffect(() => {
    if (bridgeConnected) {
      fetchQueue().then((mpdQueue) => {
        if (mpdQueue) {
          setQueue(mpdQueue);
        }
      });
    }
  }, [bridgeConnected, fetchQueue]);

  // Load directory from real MPD when browsing library or when connected
  const loadMpdPath = useCallback(
    async (path: string) => {
      if (!bridgeConnected) return;
      const res = await fetchLibrary(path);
      if (res) {
        setFolders((prev) => {
          const next = { ...prev };
          let parentPath: string | null = null;
          if (path) {
            const parts = path.split('/');
            parts.pop();
            parentPath = parts.join('/');
          }

          next[path] = {
            path,
            name: path ? path.split('/').pop() || path : 'Kütüphane Ana Dizini',
            parentPath,
            subFolders: res.folders || [],
            songs: res.songs || [],
          };
          return next;
        });
      }
    },
    [bridgeConnected, fetchLibrary]
  );

  // When connecting to real MPD, load root library and all songs
  useEffect(() => {
    if (bridgeConnected) {
      loadMpdPath('');
      fetchAllSongs().then((songs) => {
        if (songs && songs.length > 0) {
          setFolders((prev) => {
            const next = { ...prev };
            if (!next['']) {
              next[''] = {
                path: '',
                name: 'Kütüphane Ana Dizini',
                parentPath: null,
                subFolders: [],
                songs: [],
              };
            }
            return next;
          });
        }
      });
    }
  }, [bridgeConnected, loadMpdPath, fetchAllSongs]);

  // Handle navigate inside library tab
  const handleNavigateToPath = useCallback(
    (targetPath: string) => {
      setCurrentPath(targetPath);
      if (bridgeConnected) {
        loadMpdPath(targetPath);
      }
    },
    [bridgeConnected, loadMpdPath]
  );

  // Collect all songs in the library for search
  const allLibrarySongs = React.useMemo(() => {
    const list: Song[] = [];
    const seen = new Set<string>();
    (Object.values(folders) as LibraryFolder[]).forEach((folder) => {
      folder.songs.forEach((s) => {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          list.push(s);
        }
      });
    });
    return list;
  }, [folders]);

  // --- Real-time Playback Ticker ---
  useEffect(() => {
    if (status.state !== 'play') return;

    const interval = setInterval(() => {
      setStatus((prev) => {
        const curDuration = currentSong?.duration || 180;
        const nextElapsed = prev.elapsed + 1;

        if (nextElapsed >= curDuration) {
          // Track ended
          if (prev.single) {
            return { ...prev, elapsed: 0 };
          }
          // Move to next song
          setTimeout(() => handleNext(), 0);
          return { ...prev, elapsed: 0 };
        }

        return { ...prev, elapsed: nextElapsed };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status.state, currentSong?.duration, status.single]);

  // Sync currentSong duration to status
  useEffect(() => {
    if (currentSong) {
      setStatus((prev) => ({
        ...prev,
        songId: currentSong.id,
        duration: currentSong.duration,
        queueCount: queue.length,
      }));
    }
  }, [currentSong, queue.length]);

  // --- Controls Handlers ---
  const handlePlay = () => {
    setStatus((prev) => ({ ...prev, state: 'play' }));
    if (bridgeConnected) {
      sendMpdCommand('play');
    }
  };

  const handlePause = () => {
    setStatus((prev) => ({ ...prev, state: 'pause' }));
    if (bridgeConnected) {
      sendMpdCommand('pause 1');
    }
  };

  const handleStop = () => {
    setStatus((prev) => ({ ...prev, state: 'stop', elapsed: 0 }));
    if (bridgeConnected) {
      sendMpdCommand('stop');
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (bridgeConnected) {
      sendMpdCommand('next');
      return;
    }

    if (status.random) {
      const randIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randIndex);
      setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
      return;
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
    } else if (status.repeat) {
      setCurrentIndex(0);
      setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
    } else {
      setStatus((prev) => ({ ...prev, state: 'stop', elapsed: 0 }));
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;

    if (bridgeConnected) {
      sendMpdCommand('previous');
      return;
    }

    // If more than 3 seconds in, restart track
    if (status.elapsed > 3) {
      setStatus((prev) => ({ ...prev, elapsed: 0 }));
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
    } else {
      setStatus((prev) => ({ ...prev, elapsed: 0 }));
    }
  };

  const handleSeek = (seconds: number) => {
    setStatus((prev) => ({ ...prev, elapsed: Math.max(0, Math.floor(seconds)) }));
    if (bridgeConnected && currentSong) {
      sendMpdCommand(`seekcur ${Math.max(0, Math.floor(seconds))}`);
    }
  };

  const handleToggleRandom = () => {
    setStatus((prev) => {
      const next = !prev.random;
      if (bridgeConnected) {
        sendMpdCommand(`random ${next ? 1 : 0}`);
      }
      showToast(next ? 'Rastgele Çalma Açık' : 'Rastgele Çalma Kapalı');
      return { ...prev, random: next };
    });
  };

  const handleToggleRepeat = () => {
    setStatus((prev) => {
      const next = !prev.repeat;
      if (bridgeConnected) {
        sendMpdCommand(`repeat ${next ? 1 : 0}`);
      }
      showToast(next ? 'Tekrar Modu Açık' : 'Tekrar Modu Kapalı');
      return { ...prev, repeat: next };
    });
  };

  const handleToggleSingle = () => {
    setStatus((prev) => {
      const next = !prev.single;
      if (bridgeConnected) {
        sendMpdCommand(`single ${next ? 1 : 0}`);
      }
      showToast(next ? 'Tek Şarkı Modu Açık' : 'Tek Şarkı Modu Kapalı');
      return { ...prev, single: next };
    });
  };

  const handleToggleConsume = () => {
    setStatus((prev) => {
      const next = !prev.consume;
      if (bridgeConnected) {
        sendMpdCommand(`consume ${next ? 1 : 0}`);
      }
      showToast(next ? 'Tüketim Modu (Consume) Açık' : 'Tüketim Modu Kapalı');
      return { ...prev, consume: next };
    });
  };

  const handleToggleFavorite = (id: string) => {
    setQueue((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const handleVolumeChange = (vol: number) => {
    setIsMuted(false);
    setStatus((prev) => ({ ...prev, volume: vol }));
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setStatus((prev) => ({ ...prev, volume: savedVolume || 75 }));
    } else {
      setSavedVolume(status.volume);
      setIsMuted(true);
      setStatus((prev) => ({ ...prev, volume: 0 }));
    }
  };

  // --- Queue Selection & Batch Actions ---
  const handleSelectSong = (id: string, multiSelect = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(queue.map((s) => s.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handlePlaySongAt = (index: number) => {
    setCurrentIndex(index);
    setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
  };

  const handleRemoveSong = (id: string) => {
    const songIndex = queue.findIndex((s) => s.id === id);
    if (songIndex === -1) return;

    setQueue((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (songIndex === currentIndex) {
      if (queue.length <= 1) {
        handleStop();
      } else if (currentIndex >= queue.length - 1) {
        setCurrentIndex(queue.length - 2);
        setStatus((prev) => ({ ...prev, elapsed: 0 }));
      }
    } else if (songIndex < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleQueueNextSong = (id: string) => {
    const songToMove = queue.find((s) => s.id === id);
    if (!songToMove) return;

    const remaining = queue.filter((s) => s.id !== id);
    const insertPos = currentIndex + 1;
    remaining.splice(insertPos, 0, songToMove);

    setQueue(remaining);
    showToast(`"${songToMove.title}" sıradaki parça yapıldı.`);
  };

  // Batch delete selected songs
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const currentPlayingId = queue[currentIndex]?.id;

    const nextQueue = queue.filter((s) => !selectedIds.has(s.id));
    setQueue(nextQueue);
    setSelectedIds(new Set());

    // Recalculate current index
    if (nextQueue.length === 0) {
      handleStop();
      setCurrentIndex(0);
    } else {
      const newCurrentIdx = nextQueue.findIndex((s) => s.id === currentPlayingId);
      if (newCurrentIdx !== -1) {
        setCurrentIndex(newCurrentIdx);
      } else {
        setCurrentIndex(Math.min(currentIndex, nextQueue.length - 1));
      }
    }
    showToast(`${count} parça kuyruktan silindi.`);
  };

  // Batch move selected items UP (Shift+K)
  const handleBatchMoveUp = () => {
    if (selectedIds.size === 0) return;
    const currentPlayingId = queue[currentIndex]?.id;
    const newQueue = [...queue];

    for (let i = 1; i < newQueue.length; i++) {
      if (selectedIds.has(newQueue[i].id) && !selectedIds.has(newQueue[i - 1].id)) {
        const temp = newQueue[i];
        newQueue[i] = newQueue[i - 1];
        newQueue[i - 1] = temp;
      }
    }

    setQueue(newQueue);
    const newPlayingIdx = newQueue.findIndex((s) => s.id === currentPlayingId);
    if (newPlayingIdx !== -1) setCurrentIndex(newPlayingIdx);
  };

  // Batch move selected items DOWN (Shift+J)
  const handleBatchMoveDown = () => {
    if (selectedIds.size === 0) return;
    const currentPlayingId = queue[currentIndex]?.id;
    const newQueue = [...queue];

    for (let i = newQueue.length - 2; i >= 0; i--) {
      if (selectedIds.has(newQueue[i].id) && !selectedIds.has(newQueue[i + 1].id)) {
        const temp = newQueue[i];
        newQueue[i] = newQueue[i + 1];
        newQueue[i + 1] = temp;
      }
    }

    setQueue(newQueue);
    const newPlayingIdx = newQueue.findIndex((s) => s.id === currentPlayingId);
    if (newPlayingIdx !== -1) setCurrentIndex(newPlayingIdx);
  };

  // Batch Queue Next (ö / ⏭)
  const handleBatchQueueNext = () => {
    if (selectedIds.size === 0) return;
    const selectedList = queue.filter((s) => selectedIds.has(s.id));
    const nonSelected = queue.filter((s) => !selectedIds.has(s.id));
    const currentPlayingId = queue[currentIndex]?.id;

    const currentInNonSelected = nonSelected.findIndex((s) => s.id === currentPlayingId);
    const insertPos = currentInNonSelected !== -1 ? currentInNonSelected + 1 : 0;

    nonSelected.splice(insertPos, 0, ...selectedList);
    setQueue(nonSelected);

    const newIdx = nonSelected.findIndex((s) => s.id === currentPlayingId);
    if (newIdx !== -1) setCurrentIndex(newIdx);

    showToast(`${selectedList.length} parça sıradaki yapıldı.`);
  };

  // Clear entire queue
  const handleClearQueue = () => {
    if (window.confirm('Çalma listesi sıfırlansın mı?')) {
      setQueue([]);
      setSelectedIds(new Set());
      handleStop();
      showToast('Çalma listesi temizlendi.');
    }
  };

  // --- Library Actions ---
  const handleAddSongToQueue = async (song: Song) => {
    if (bridgeConnected) {
      if (song.file) {
        await sendMpdCommand(`add "${song.file.replace(/"/g, '\\"')}"`);
        const updatedQueue = await fetchQueue();
        if (updatedQueue) setQueue(updatedQueue);
      }
    } else {
      const newSong = { ...song, id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
      setQueue((prev) => [...prev, newSong]);
    }
    showToast(`"${song.title}" kuyruğa eklendi.`);
  };

  const handlePlaySongNow = async (song: Song) => {
    if (bridgeConnected) {
      if (song.file) {
        await sendMpdCommand(`add "${song.file.replace(/"/g, '\\"')}"`);
        const updatedQueue = await fetchQueue();
        if (updatedQueue) {
          setQueue(updatedQueue);
          const lastIdx = updatedQueue.length - 1;
          await sendMpdCommand(`play ${lastIdx}`);
        }
      }
    } else {
      const newSong = { ...song, id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
      setQueue((prev) => {
        const next = [...prev];
        next.splice(currentIndex + 1, 0, newSong);
        return next;
      });
      setCurrentIndex((prev) => prev + 1);
      setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
    }
    showToast(`"${song.title}" çalınıyor.`);
  };

  const handleAddAllToQueue = async (songsToAdd: Song[]) => {
    if (bridgeConnected) {
      for (const s of songsToAdd) {
        if (s.file) {
          await sendMpdCommand(`add "${s.file.replace(/"/g, '\\"')}"`);
        }
      }
      const updatedQueue = await fetchQueue();
      if (updatedQueue) setQueue(updatedQueue);
    } else {
      const newSongs = songsToAdd.map((s) => ({
        ...s,
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      }));
      setQueue((prev) => [...prev, ...newSongs]);
    }
    showToast(`${songsToAdd.length} parça kuyruğa eklendi.`);
  };

  // Add an entire folder to queue directly in MPD
  const handleAddFolderToQueue = async (folderPath: string) => {
    const folderName = folderPath.split('/').pop() || folderPath;
    if (bridgeConnected) {
      // In MPD, add "<path>" adds all files recursively inside that folder!
      const res = await sendMpdCommand(`add "${folderPath.replace(/"/g, '\\"')}"`);
      const updatedQueue = await fetchQueue();
      if (updatedQueue) setQueue(updatedQueue);
      showToast(`"${folderName}" klasörü sıraya eklendi.`);
    } else {
      showToast(`MPD bağlantısı yok.`);
    }
  };

  // --- Streams Actions ---
  const handlePlayStream = (stream: StreamItem) => {
    const streamSong: Song = {
      id: `stream-${Date.now()}`,
      file: stream.url,
      title: stream.name,
      artist: stream.genre || 'Canlı Radyo',
      album: 'İnternet Akışı',
      duration: 0,
      genre: stream.genre,
    };
    setQueue((prev) => [streamSong, ...prev]);
    setCurrentIndex(0);
    setStatus((prev) => ({ ...prev, elapsed: 0, state: 'play' }));
    setCurrentTab('queue');
    showToast(`"${stream.name}" akışı başlatıldı.`);
  };

  const handleAddStreamToQueue = (stream: StreamItem) => {
    const streamSong: Song = {
      id: `stream-${Date.now()}`,
      file: stream.url,
      title: stream.name,
      artist: stream.genre || 'Canlı Radyo',
      album: 'İnternet Akışı',
      duration: 0,
    };
    setQueue((prev) => [...prev, streamSong]);
    showToast(`"${stream.name}" akışı kuyruğa eklendi.`);
  };

  const handleAddCustomStream = (newStream: StreamItem) => {
    setStreams((prev) => [newStream, ...prev]);
    showToast(`"${newStream.name}" listeye eklendi.`);
  };

  const handleRemoveStream = (id: string) => {
    setStreams((prev) => prev.filter((s) => s.id !== id));
    showToast('Akış silindi.');
  };

  // --- Database Update ---
  const handleUpdateDb = async () => {
    setIsUpdatingDb(true);
    if (bridgeConnected) {
      await sendMpdCommand('update');
      showToast('MPD "update" komutu gönderildi.');
    } else {
      showToast('MPD bağlantısı bulunamadı.');
    }
    setTimeout(() => {
      setIsUpdatingDb(false);
    }, 1000);
  };

  const handleConfigChange = async (newConfig: MpdConfig) => {
    setConfig(newConfig);
    await connectBridge(newConfig.host, newConfig.port, newConfig.password);
  };

  // --- Save Playlist ---
  const handleSavePlaylist = (name: string) => {
    showToast(`"${name}" çalma listesi başarıyla kaydedildi.`);
  };

  // --- Keyboard Shortcuts (ncmpcpp style) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          status.state === 'play' ? handlePause() : handlePlay();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          handlePrev();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          handleNext();
          break;
        case 'z':
          e.preventDefault();
          handleToggleRandom();
          break;
        case 'r':
          e.preventDefault();
          handleToggleRepeat();
          break;
        case 'y':
          e.preventDefault();
          handleToggleSingle();
          break;
        case 'x':
          e.preventDefault();
          handleToggleConsume();
          break;
        case 'd':
        case 'Delete':
          e.preventDefault();
          handleBatchDelete();
          break;
        case 'c':
          e.preventDefault();
          handleClearQueue();
          break;
        case 'ö':
        case ']':
          e.preventDefault();
          handleBatchQueueNext();
          break;
        case 'J':
          if (e.shiftKey) {
            e.preventDefault();
            handleBatchMoveDown();
          }
          break;
        case 'K':
          if (e.shiftKey) {
            e.preventDefault();
            handleBatchMoveUp();
          }
          break;
        case '/':
          e.preventDefault();
          document.getElementById('main-search-input')?.focus();
          break;
        case '?':
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
          break;
        case 'Escape':
          setShortcutsOpen(false);
          setAddStreamOpen(false);
          setSavePlaylistOpen(false);
          setSettingsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex flex-col font-['Quicksand'] pb-20 md:pb-8 selection:bg-[#fab387]/30 selection:text-[#fab387]">
      {/* App Header */}
      <AppHeader
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'library') setCurrentPath('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenAddStream={() => setAddStreamOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onUpdateDb={handleUpdateDb}
        isUpdatingDb={isUpdatingDb}
        config={config}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6 flex-1">
        {/* Now Playing Top Card */}
        <NowPlayingCard
          currentSong={currentSong}
          status={status}
          selectedCount={selectedIds.size}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onToggleRandom={handleToggleRandom}
          onToggleRepeat={handleToggleRepeat}
          onToggleSingle={handleToggleSingle}
          onToggleConsume={handleToggleConsume}
          onToggleFavorite={handleToggleFavorite}
          onBatchDelete={handleBatchDelete}
          onBatchMoveUp={handleBatchMoveUp}
          onBatchMoveDown={handleBatchMoveDown}
          onBatchQueueNext={handleBatchQueueNext}
          onClearQueue={handleClearQueue}
          onOpenSaveModal={() => setSavePlaylistOpen(true)}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />

        {/* View Tabs */}
        {currentTab === 'queue' && (
          <QueueView
            queue={queue}
            currentIndex={currentIndex}
            playbackState={status.state}
            selectedIds={selectedIds}
            onSelectSong={handleSelectSong}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onPlaySongAt={handlePlaySongAt}
            onRemoveSong={handleRemoveSong}
            onQueueNextSong={handleQueueNextSong}
            onToggleFavorite={handleToggleFavorite}
            onGoToLibrary={() => setCurrentTab('library')}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            currentPath={currentPath}
            folders={folders}
            searchQuery={searchQuery}
            allSongs={allLibrarySongs}
            onNavigateTo={handleNavigateToPath}
            onAddSongToQueue={handleAddSongToQueue}
            onPlaySongNow={handlePlaySongNow}
            onAddAllToQueue={handleAddAllToQueue}
            onAddFolderToQueue={handleAddFolderToQueue}
          />
        )}

        {currentTab === 'streams' && (
          <StreamsView
            streams={streams}
            onPlayStream={handlePlayStream}
            onAddStreamToQueue={handleAddStreamToQueue}
            onRemoveStream={handleRemoveStream}
            onOpenAddModal={() => setAddStreamOpen(true)}
          />
        )}
      </main>

      {/* Mobile Mini Player (Fixed at bottom on small screens) */}
      <MobileMiniPlayer
        currentSong={currentSong}
        playbackState={status.state}
        elapsed={status.elapsed}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleFavorite={handleToggleFavorite}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#fab387] text-[#11111b] font-bold text-xs sm:text-sm shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <AddStreamModal
        isOpen={addStreamOpen}
        onClose={() => setAddStreamOpen(false)}
        onAddStream={handleAddCustomStream}
      />
      <SavePlaylistModal
        isOpen={savePlaylistOpen}
        onClose={() => setSavePlaylistOpen(false)}
        onSave={handleSavePlaylist}
        songCount={queue.length}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSaveConfig={handleConfigChange}
      />
    </div>
  );
}
