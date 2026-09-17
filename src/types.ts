/**
 * FMPD - Catppuccin & Ghibli MPD Web Client Types
 */

export type PlaybackState = 'play' | 'pause' | 'stop';

export interface Song {
  id: string;
  file: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  track?: string;
  date?: string;
  genre?: string;
  isFavorite?: boolean;
  coverArt?: string;
}

export interface MpdStatus {
  state: PlaybackState;
  songIndex: number;
  songId: string;
  elapsed: number; // in seconds
  duration: number;
  volume: number; // 0 - 100
  repeat: boolean;
  random: boolean;
  single: boolean;
  consume: boolean;
  bitRate?: string;
  audioFormat?: string;
  queueCount: number;
}

export interface LibraryFolder {
  path: string;
  name: string;
  parentPath: string | null;
  subFolders: string[];
  songs: Song[];
}

export interface StreamItem {
  id: string;
  name: string;
  url: string;
  genre?: string;
  bitrate?: string;
  icon?: string;
}

export interface MpdConfig {
  host: string;
  port: number;
  wsUrl: string;
  password?: string;
  connected: boolean;
}

export type TabType = 'queue' | 'library' | 'streams';
