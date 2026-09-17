/**
 * MPD Bridge Client Hook and API Helper
 * Seamlessly manages REST & WebSocket communication to the MPD Bridge
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Song, MpdStatus, MpdConfig } from '../types';

export function useMpdBridge(
  config: MpdConfig,
  showToast: (msg: string) => void,
  onStatusUpdate?: (status: Partial<MpdStatus>, currentTrack?: any) => void
) {
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Send command to server bridge
  const sendMpdCommand = useCallback(async (command: string): Promise<string[] | null> => {
    try {
      const res = await fetch('/api/mpd/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.success) {
        return data.result || [];
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fetch real queue from MPD server
  const fetchQueue = useCallback(async (): Promise<Song[] | null> => {
    try {
      const res = await fetch('/api/mpd/queue');
      const data = await res.json();
      return data.queue || null;
    } catch {
      return null;
    }
  }, []);

  // Fetch real library folder/songs from MPD server
  const fetchLibrary = useCallback(async (path = '') => {
    try {
      const res = await fetch(`/api/mpd/library?path=${encodeURIComponent(path)}`);
      return await res.json();
    } catch {
      return { folders: [], songs: [] };
    }
  }, []);

  // Fetch all songs from MPD database
  const fetchAllSongs = useCallback(async (): Promise<Song[]> => {
    try {
      const res = await fetch('/api/mpd/all-songs');
      const data = await res.json();
      return data.songs || [];
    } catch {
      return [];
    }
  }, []);

  // Connect MPD host and port
  const connectBridge = useCallback(async (host: string, port: number, password?: string) => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/mpd/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, password }),
      });
      const data = await res.json();
      setIsConnecting(false);
      if (data.success) {
        setBridgeConnected(true);
        showToast(`MPD bağlantısı başarılı: ${host}:${port}`);
        return true;
      } else {
        setBridgeConnected(false);
        showToast(`MPD bağlantı kurulamadı: ${data.error || 'Porta ulaşılamadı'}`);
        return false;
      }
    } catch (err: any) {
      setIsConnecting(false);
      setBridgeConnected(false);
      showToast(`Bağlantı hatası: ${err.message}`);
      return false;
    }
  }, [showToast]);

  // Connect WebSocket to /api/mpd-ws for real-time push events
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/mpd-ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // WS opened
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'bridge_status') {
          setBridgeConnected(msg.connected);
        } else if (msg.type === 'status' && msg.data) {
          if (onStatusUpdate) {
            onStatusUpdate(msg.data, msg.data.currentTrack);
          }
        }
      } catch {
        // Ignore parse error
      }
    };

    ws.onclose = () => {
      // WS closed
    };

    return () => {
      ws.close();
    };
  }, [onStatusUpdate]);

  return {
    bridgeConnected,
    isConnecting,
    connectBridge,
    sendMpdCommand,
    fetchQueue,
    fetchLibrary,
    fetchAllSongs,
  };
}
