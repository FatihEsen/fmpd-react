/**
 * FMPD - Catppuccin & Ghibli MPD Web Client
 * Modern React & TypeScript Rewrite
 *
 * The MPD server is the single source of truth:
 *  - every queue mutation is sent to MPD and the local state is refreshed
 *    from the server afterwards,
 *  - the playback state (position, elapsed time, modes) comes from the
 *    status stream the server pushes over the WebSocket.
 * The local state only holds what is purely a UI concern (selection, search,
 * open modals, ...).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  MpdStatus,
  TabType,
  MpdConfig,
  LibraryFolder,
} from './types';
import { mpdCommands } from './utils/mpdCommands';
import {
  buildMoveCommands,
  buildQueueNextCommands,
  buildDeleteCommands,
} from './utils/queueOps';
import { AppHeader } from './components/AppHeader';
import { QueueView } from './components/QueueView';
import { LibraryView } from './components/LibraryView';
import { FooterPlayer } from './components/FooterPlayer';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { SavePlaylistModal } from './components/modals/SavePlaylistModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { useMpdBridge } from './hooks/useMpdBridge';

const ROOT_FOLDER: LibraryFolder = {
  path: '',
  name: 'Kütüphane Ana Dizini',
  parentPath: null,
  subFolders: [],
  songs: [],
};

export default function App() {
  // --- UI state ---
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState<TabType>('queue');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<Record<string, LibraryFolder>>({
    '': ROOT_FOLDER,
  });
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
  // Modals
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [savePlaylistOpen, setSavePlaylistOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isUpdatingDb, setIsUpdatingDb] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mute & Volume
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [savedVolume, setSavedVolume] = useState<number>(85);

  // Config with persistent localStorage retrieval
  const [config, setConfig] = useState<MpdConfig>(() => {
    try {
      const saved = localStorage.getItem('fmpd_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          host: parsed.host || 'localhost',
          port: parsed.port || 6600,
          password: parsed.password || '',
          connected: false,
        };
      }
    } catch {}
    return {
      host: 'localhost',
      port: 6600,
      connected: false,
    };
  });

  const [status, setStatus] = useState<MpdStatus>({
    state: 'stop',
    songIndex: -1,
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

  // --- Refs (values that change often must not retrigger effects) ---
  const statusRef = useRef<MpdStatus>(status);
  const queueRef = useRef<Song[]>(queue);
  const favoriteFilesRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsRef = useRef<Record<string, (...args: any[]) => void> | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const currentSong = queue[currentIndex] || null;

  // Show quick toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  // Handle live status updates pushed from MPD
  const handleMpdStatusUpdate = useCallback(
    (mpdStatus: Partial<MpdStatus>, currentTrack?: any) => {
      setStatus((prev) => ({
        ...prev,
        ...mpdStatus,
        duration:
          mpdStatus.duration ||
          (currentTrack?.duration ? parseInt(currentTrack.duration, 10) : prev.duration),
      }));

      // -1 means MPD does not know a position (stopped) - keep the last one.
      if (typeof mpdStatus.songIndex === 'number' && mpdStatus.songIndex >= 0) {
        setCurrentIndex(mpdStatus.songIndex);
      }
    },
    []
  );

  // Native MPD Bridge integration hook
  const {
    bridgeConnected,
    connectBridge,
    sendMpdCommand,
    sendMpdCommands,
    fetchQueue,
    fetchLibrary,
    fetchAllSongs,
  } = useMpdBridge(config, showToast, handleMpdStatusUpdate);

  // Sync bridge state into config
  useEffect(() => {
    setConfig((prev) => ({ ...prev, connected: bridgeConnected }));
  }, [bridgeConnected]);

  // --- Command helpers ---
  const runCommand = useCallback(
    async (command: string): Promise<boolean> => {
      const result = await sendMpdCommand(command);
      if (result === null) {
        showToast('MPD komutu başarısız oldu.');
        return false;
      }
      return true;
    },
    [sendMpdCommand, showToast]
  );

  const runCommands = useCallback(
    async (commands: string[]): Promise<boolean> => {
      if (commands.length === 0) return true;
      const ok = await sendMpdCommands(commands);
      if (!ok) {
        showToast('MPD komutları başarısız oldu.');
        return false;
      }
      return true;
    },
    [sendMpdCommands, showToast]
  );

  /** Replaces the local queue with the playlist MPD reports. */
  const applyQueue = useCallback((newQueue: Song[]) => {
    const favorites = favoriteFilesRef.current;
    const decorated = newQueue.map((s) =>
      favorites.has(s.file) ? { ...s, isFavorite: true } : s
    );

    setQueue(decorated);

    // Keep pointing at the song that is actually playing, even when the
    // playlist shifted because of a move or a deletion.
    const playingId = statusRef.current.songId;
    if (playingId) {
      const index = decorated.findIndex((s) => s.id === playingId);
      if (index !== -1) {
        setCurrentIndex(index);
        return;
      }
    }
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, decorated.length - 1)));
  }, []);

  const refreshQueue = useCallback(async (): Promise<Song[] | null> => {
    const mpdQueue = await fetchQueue();
    if (mpdQueue) applyQueue(mpdQueue);
    return mpdQueue;
  }, [fetchQueue, applyQueue]);

  // Sync queue from MPD when connected
  useEffect(() => {
    if (bridgeConnected) {
      refreshQueue();
    }
  }, [bridgeConnected, refreshQueue]);

  // The playlist length is reported with every status update - if it does
  // not match the local queue, MPD changed it (consume mode, another
  // client, ...) and we have to pull it again.
  useEffect(() => {
    if (!bridgeConnected) return;
    if (typeof status.queueCount !== 'number') return;
    if (status.queueCount !== queueRef.current.length) {
      refreshQueue();
    }
  }, [status.queueCount, bridgeConnected, refreshQueue]);

  // --- Library ---
  const loadMpdPath = useCallback(
    async (path: string) => {
      const res = await fetchLibrary(path);
      if (!res) return;

      const favorites = favoriteFilesRef.current;
      const songs: Song[] = (res.songs || []).map((s: Song) =>
        favorites.has(s.file) ? { ...s, isFavorite: true } : s
      );

      setFolders((prev) => {
        const next = { ...prev };
        const parentPath = path ? path.split('/').slice(0, -1).join('/') : null;
        next[path] = {
          path,
          name: path ? path.split('/').pop() || path : ROOT_FOLDER.name,
          parentPath,
          subFolders: res.folders || [],
          songs,
        };
        return next;
      });
    },
    [fetchLibrary]
  );

  // Load the library root and the whole database once, so the search covers
  // every track and not only the folders that were opened before.
  useEffect(() => {
    if (!bridgeConnected) return;
    let cancelled = false;

    loadMpdPath('');

    fetchAllSongs().then((songs) => {
      if (cancelled || !songs) return;
      const favorites = favoriteFilesRef.current;
      setLibrarySongs(
        songs.map((s) => (favorites.has(s.file) ? { ...s, isFavorite: true } : s))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [bridgeConnected, fetchAllSongs, loadMpdPath]);

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

  // --- Playback controls (all state lives in MPD) ---
  const handlePlay = useCallback(async () => {
    if (!bridgeConnected) {
      showToast('MPD bağlantısı yok.');
      return;
    }
    if (statusRef.current.state === 'pause') {
      setStatus((prev) => ({ ...prev, state: 'play' }));
      await runCommand(mpdCommands.pause(false));
    } else {
      await runCommand(mpdCommands.play());
    }
  }, [bridgeConnected, runCommand, showToast]);

  const handlePause = useCallback(async () => {
    if (!bridgeConnected) return;
    setStatus((prev) => ({ ...prev, state: 'pause' }));
    await runCommand(mpdCommands.pause(true));
  }, [bridgeConnected, runCommand]);

  const handleStop = useCallback(async () => {
    if (!bridgeConnected) return;
    setStatus((prev) => ({ ...prev, state: 'stop', elapsed: 0 }));
    await runCommand(mpdCommands.stop());
  }, [bridgeConnected, runCommand]);

  const handleNext = useCallback(async () => {
    if (!bridgeConnected) return;
    await runCommand(mpdCommands.next());
  }, [bridgeConnected, runCommand]);

  const handlePrev = useCallback(async () => {
    if (!bridgeConnected) return;
    // Like ncmpcpp: more than three seconds into a track means "restart it".
    if (statusRef.current.elapsed > 3) {
      setStatus((prev) => ({ ...prev, elapsed: 0 }));
      await runCommand(mpdCommands.seek(0));
    } else {
      await runCommand(mpdCommands.previous());
    }
  }, [bridgeConnected, runCommand]);

  const handleSeek = useCallback(
    async (seconds: number) => {
      const duration = statusRef.current.duration;
      const wanted = Math.floor(seconds);
      const sec = Math.max(0, duration > 0 ? Math.min(wanted, duration) : wanted);
      setStatus((prev) => ({ ...prev, elapsed: sec }));
      if (bridgeConnected) {
        await runCommand(mpdCommands.seek(sec));
      }
    },
    [bridgeConnected, runCommand]
  );

  const handlePlaySongAt = useCallback(
    async (index: number) => {
      if (index < 0 || index >= queueRef.current.length) return;
      if (!bridgeConnected) return;
      setCurrentIndex(index);
      setStatus((prev) => ({ ...prev, state: 'play', elapsed: 0 }));
      await runCommand(mpdCommands.play(index));
    },
    [bridgeConnected, runCommand]
  );

  // --- MPD modes ---
  const handleToggleRandom = useCallback(async () => {
    const next = !statusRef.current.random;
    setStatus((prev) => ({ ...prev, random: next }));
    if (bridgeConnected) await runCommand(mpdCommands.random(next));
    showToast(next ? 'Rastgele Çalma Açık' : 'Rastgele Çalma Kapalı');
  }, [bridgeConnected, runCommand, showToast]);

  const handleToggleRepeat = useCallback(async () => {
    const next = !statusRef.current.repeat;
    setStatus((prev) => ({ ...prev, repeat: next }));
    if (bridgeConnected) await runCommand(mpdCommands.repeat(next));
    showToast(next ? 'Tekrar Modu Açık' : 'Tekrar Modu Kapalı');
  }, [bridgeConnected, runCommand, showToast]);

  const handleToggleSingle = useCallback(async () => {
    const next = !statusRef.current.single;
    setStatus((prev) => ({ ...prev, single: next }));
    if (bridgeConnected) await runCommand(mpdCommands.single(next));
    showToast(next ? 'Tek Şarkı Modu Açık' : 'Tek Şarkı Modu Kapalı');
  }, [bridgeConnected, runCommand, showToast]);

  const handleToggleConsume = useCallback(async () => {
    const next = !statusRef.current.consume;
    setStatus((prev) => ({ ...prev, consume: next }));
    if (bridgeConnected) await runCommand(mpdCommands.consume(next));
    showToast(next ? 'Tüketim Modu (Consume) Açık' : 'Tüketim Modu Kapalı');
  }, [bridgeConnected, runCommand, showToast]);

  // --- Volume ---
  const handleVolumeChange = useCallback(
    async (vol: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(vol)));
      setIsMuted(false);
      setStatus((prev) => ({ ...prev, volume: clamped }));
      if (bridgeConnected) {
        await runCommand(mpdCommands.setVolume(clamped));
      }
    },
    [bridgeConnected, runCommand]
  );

  const handleToggleMute = useCallback(async () => {
    if (isMuted) {
      const restoreVol = savedVolume || 75;
      setIsMuted(false);
      setStatus((prev) => ({ ...prev, volume: restoreVol }));
      if (bridgeConnected) {
        await runCommand(mpdCommands.setVolume(restoreVol));
      }
    } else {
      setSavedVolume(statusRef.current.volume);
      setIsMuted(true);
      setStatus((prev) => ({ ...prev, volume: 0 }));
      if (bridgeConnected) {
        await runCommand(mpdCommands.setVolume(0));
      }
    }
  }, [isMuted, savedVolume, bridgeConnected, runCommand]);

  // --- Favorites (local, keyed by file path so they survive a refetch) ---
  const handleToggleFavorite = useCallback((song: Song) => {
    const favorites = new Set(favoriteFilesRef.current);
    if (favorites.has(song.file)) {
      favorites.delete(song.file);
    } else {
      favorites.add(song.file);
    }
    favoriteFilesRef.current = favorites;

    const toggle = (s: Song) =>
      s.file === song.file ? { ...s, isFavorite: favorites.has(s.file) } : s;

    setQueue((prev) => prev.map(toggle));
    setLibrarySongs((prev) => prev.map(toggle));
    setFolders((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key], songs: next[key].songs.map(toggle) };
      }
      return next;
    });
  }, []);

  // --- Queue selection ---
  const handleSelectSong = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(queueRef.current.map((s) => s.id)));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // --- Queue mutations (all of them end up in MPD) ---
  const handleRemoveSong = useCallback(
    async (id: string) => {
      const list = queueRef.current;
      const position = list.findIndex((s) => s.id === id);
      if (position === -1) return;

      // MPD addresses songs by their 0-based playlist position.
      const ok = await runCommand(mpdCommands.deleteAt(position));
      if (!ok) return;

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await refreshQueue();
    },
    [runCommand, refreshQueue]
  );

  const handleQueueNextSong = useCallback(
    async (id: string) => {
      const list = queueRef.current;
      const from = list.findIndex((s) => s.id === id);
      if (from === -1) return;

      const target = Math.min(currentIndex + 1, list.length - 1);
      if (from === target) {
        showToast('Parça zaten sıradaki konumda.');
        return;
      }

      const ok = await runCommand(mpdCommands.move(from, target));
      if (!ok) return;

      await refreshQueue();
      showToast(`"${list[from].title}" sıradaki parça yapıldı.`);
    },
    [currentIndex, runCommand, refreshQueue, showToast]
  );

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const commands = buildDeleteCommands(queueRef.current, selectedIds);
    if (commands.length === 0) {
      showToast('Silinecek parça bulunamadı.');
      return;
    }

    const ok = await runCommands(commands);
    if (!ok) return;

    setSelectedIds(new Set());
    await refreshQueue();
    showToast(`${commands.length} parça kuyruktan silindi.`);
  }, [selectedIds, runCommands, refreshQueue, showToast]);

  const handleBatchMoveUp = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const commands = buildMoveCommands(queueRef.current, selectedIds, 'up');
    if (commands.length === 0) return;

    const ok = await runCommands(commands);
    if (!ok) return;

    await refreshQueue();
  }, [selectedIds, runCommands, refreshQueue]);

  const handleBatchMoveDown = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const commands = buildMoveCommands(queueRef.current, selectedIds, 'down');
    if (commands.length === 0) return;

    const ok = await runCommands(commands);
    if (!ok) return;

    await refreshQueue();
  }, [selectedIds, runCommands, refreshQueue]);

  const handleBatchQueueNext = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const commands = buildQueueNextCommands(
      queueRef.current,
      selectedIds,
      currentIndex + 1
    );
    if (commands.length === 0) return;

    const ok = await runCommands(commands);
    if (!ok) return;

    await refreshQueue();
    showToast(`${selectedIds.size} parça sıradaki yapıldı.`);
  }, [selectedIds, currentIndex, runCommands, refreshQueue, showToast]);

  const handleClearQueue = useCallback(async () => {
    if (!window.confirm('Çalma listesi sıfırlansın mı?')) return;

    const ok = await runCommand(mpdCommands.clear());
    if (!ok) return;

    setSelectedIds(new Set());
    await refreshQueue();
    showToast('Çalma listesi temizlendi.');
  }, [runCommand, refreshQueue, showToast]);

  // --- Library actions ---
  const handleAddSongToQueue = useCallback(
    async (song: Song) => {
      if (!song.file) return;

      const ok = await runCommand(mpdCommands.add(song.file));
      if (!ok) return;

      await refreshQueue();
      showToast(`"${song.title}" kuyruğa eklendi.`);
    },
    [runCommand, refreshQueue, showToast]
  );

  const handlePlaySongNow = useCallback(
    async (song: Song) => {
      if (!song.file) return;

      const ok = await runCommand(mpdCommands.add(song.file));
      if (!ok) return;

      const updated = await refreshQueue();
      if (updated && updated.length > 0) {
        await runCommand(mpdCommands.play(updated.length - 1));
      }
      showToast(`"${song.title}" çalınıyor.`);
    },
    [runCommand, refreshQueue, showToast]
  );

  const handleAddAllToQueue = useCallback(
    async (songsToAdd: Song[]) => {
      const files = songsToAdd.map((s) => s.file).filter(Boolean);
      if (files.length === 0) return;

      const ok = await runCommands(files.map((f) => mpdCommands.add(f)));
      if (!ok) return;

      await refreshQueue();
      showToast(`${files.length} parça kuyruğa eklendi.`);
    },
    [runCommands, refreshQueue, showToast]
  );

  const handleAddFolderToQueue = useCallback(
    async (folderPath: string) => {
      const folderName = folderPath.split('/').pop() || folderPath;

      // In MPD, `add "<path>"` adds every file below that directory.
      const ok = await runCommand(mpdCommands.add(folderPath));
      if (!ok) return;

      await refreshQueue();
      showToast(`"${folderName}" klasörü sıraya eklendi.`);
    },
    [runCommand, refreshQueue, showToast]
  );

  // --- Database Update ---
  const handleUpdateDb = useCallback(async () => {
    if (!bridgeConnected) {
      showToast('MPD bağlantısı bulunamadı.');
      return;
    }

    setIsUpdatingDb(true);
    const ok = await runCommand(mpdCommands.update());
    showToast(
      ok
        ? 'MPD "update" komutu gönderildi.'
        : 'MPD "update" komutu başarısız oldu.'
    );
    setTimeout(() => setIsUpdatingDb(false), 1000);
  }, [bridgeConnected, runCommand, showToast]);

  // --- Settings ---
  const handleConfigChange = useCallback(
    async (newConfig: MpdConfig) => {
      setConfig(newConfig);
      try {
        localStorage.setItem('fmpd_config', JSON.stringify(newConfig));
      } catch {}
      await connectBridge(newConfig.host, newConfig.port, newConfig.password);
    },
    [connectBridge]
  );

  // --- Save Playlist ---
  const handleSavePlaylist = useCallback(
    async (name: string) => {
      const ok = await runCommand(mpdCommands.savePlaylist(name));
      if (!ok) return;
      showToast(`"${name}" çalma listesi MPD'ye kaydedildi.`);
    },
    [runCommand, showToast]
  );

  // --- Keyboard Shortcuts (ncmpcpp style) ---
  const actions = {
    handlePlay,
    handlePause,
    handleStop,
    handleNext,
    handlePrev,
    handleToggleRandom,
    handleToggleRepeat,
    handleToggleSingle,
    handleToggleConsume,
    handleToggleMute,
    handleBatchDelete,
    handleClearQueue,
    handleBatchQueueNext,
    handleBatchMoveUp,
    handleBatchMoveDown,
    handleSeek,
    handleVolumeChange,
  };

  // Keep the latest handlers available without re-registering the listener
  // on every render.
  useEffect(() => {
    actionsRef.current = actions as unknown as Record<string, (...args: any[]) => void>;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = actionsRef.current;
      if (!current) return;

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
          if (statusRef.current.state === 'play') current.handlePause();
          else current.handlePlay();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          current.handlePrev();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          current.handleNext();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          current.handleStop();
          break;
        case 'z':
          e.preventDefault();
          current.handleToggleRandom();
          break;
        case 'r':
          e.preventDefault();
          current.handleToggleRepeat();
          break;
        case 'y':
          e.preventDefault();
          current.handleToggleSingle();
          break;
        case 'x':
          e.preventDefault();
          current.handleToggleConsume();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          current.handleToggleMute();
          break;
        case '+':
        case '=':
          e.preventDefault();
          current.handleVolumeChange(statusRef.current.volume + 5);
          break;
        case '-':
        case '_':
          e.preventDefault();
          current.handleVolumeChange(statusRef.current.volume - 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          current.handleSeek(statusRef.current.elapsed - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          current.handleSeek(statusRef.current.elapsed + 5);
          break;
        case 'd':
        case 'Delete':
          e.preventDefault();
          current.handleBatchDelete();
          break;
        case 'c':
          e.preventDefault();
          current.handleClearQueue();
          break;
        case 'ö':
        case ']':
          e.preventDefault();
          current.handleBatchQueueNext();
          break;
        case 'J':
          if (e.shiftKey) {
            e.preventDefault();
            current.handleBatchMoveDown();
          }
          break;
        case 'K':
          if (e.shiftKey) {
            e.preventDefault();
            current.handleBatchMoveUp();
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
          setSavePlaylistOpen(false);
          setSettingsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex flex-col font-['Quicksand'] pb-28 sm:pb-32 md:pb-28 selection:bg-[#fab387]/30 selection:text-[#fab387]">
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
        onOpenSettings={() => setSettingsOpen(true)}
        onUpdateDb={handleUpdateDb}
        isUpdatingDb={isUpdatingDb}
        config={config}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6 flex-1">
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
            onPlay={handlePlay}
            onPause={handlePause}
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
            allSongs={librarySongs}
            onNavigateTo={handleNavigateToPath}
            onAddSongToQueue={handleAddSongToQueue}
            onPlaySongNow={handlePlaySongNow}
            onAddAllToQueue={handleAddAllToQueue}
            onAddFolderToQueue={handleAddFolderToQueue}
          />
        )}
      </main>

      {/* Sticky Now Playing Footer Player (Active on Desktop, Tablet & Mobile) */}
      <FooterPlayer
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
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 sm:bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#fab387] text-[#11111b] font-bold text-xs sm:text-sm shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
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
