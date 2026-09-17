/**
 * MPD Native Socket Client & Bridge
 * Connects directly to standard MPD TCP Port (default 6600)
 * Translates MPD protocol to JSON events for Web UI
 */

import net from 'net';
import { EventEmitter } from 'events';

export interface MpdServerStatus {
  state: 'play' | 'pause' | 'stop';
  songIndex: number;
  songId: string;
  elapsed: number;
  duration: number;
  volume: number;
  repeat: boolean;
  random: boolean;
  single: boolean;
  consume: boolean;
  bitRate?: string;
  audioFormat?: string;
  queueCount: number;
  currentTrack?: {
    id: string;
    file: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    track?: string;
    date?: string;
    genre?: string;
  };
}

export class MpdBridgeClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private password?: string;
  private isConnected = false;
  private buffer = '';
  private commandQueue: Array<{
    cmd: string;
    resolve: (res: string[]) => void;
    reject: (err: Error) => void;
  }> = [];
  private currentCommand: {
    cmd: string;
    resolve: (res: string[]) => void;
    reject: (err: Error) => void;
  } | null = null;
  private currentResponseLines: string[] = [];
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(host = 'localhost', port = 6600, password?: string) {
    super();
    this.host = host;
    this.port = port;
    this.password = password;

    // Prevent Node process crash on unhandled 'error' event when MPD is offline
    this.on('error', () => {
      // Handled silently or logged
    });
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.disconnect();
      this.socket = new net.Socket();

      this.socket.setTimeout(8000);

      this.socket.connect(this.port, this.host, () => {
        // Socket opened, waiting for 'OK MPD ...'
      });

      this.socket.on('data', (chunk) => {
        this.buffer += chunk.toString('utf-8');
        this.processBuffer();
      });

      this.socket.on('error', (err) => {
        console.warn(`[MPD Socket] Cannot connect to ${this.host}:${this.port} (MPD not running locally?):`, err.message);
        this.emit('error', err);
        resolve(false);
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
        this.stopPolling();
      });

      this.socket.on('timeout', () => {
        if (!this.isConnected) {
          this.socket?.destroy();
          resolve(false);
        }
      });

      const onInit = (greeting: string) => {
        if (greeting.startsWith('OK MPD')) {
          this.isConnected = true;
          this.emit('connected', greeting);
          if (this.password) {
            this.sendCommand(`password ${this.password}`)
              .then(() => resolve(true))
              .catch(() => resolve(true));
          } else {
            resolve(true);
          }
          this.startPolling();
        } else {
          resolve(false);
        }
      };

      this.once('greeting', onInit);
      setTimeout(() => {
        if (!this.isConnected) resolve(false);
      }, 5000);
    });
  }

  public disconnect() {
    this.stopPolling();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  private processBuffer() {
    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).replace(/\r$/, '');
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (!this.isConnected && line.startsWith('OK MPD')) {
        this.emit('greeting', line);
      } else {
        this.handleLine(line);
      }

      newlineIndex = this.buffer.indexOf('\n');
    }
  }

  private handleLine(line: string) {
    if (line === 'OK') {
      if (this.currentCommand) {
        this.currentCommand.resolve(this.currentResponseLines);
        this.currentCommand = null;
        this.currentResponseLines = [];
        this.sendNext();
      }
    } else if (line.startsWith('ACK')) {
      if (this.currentCommand) {
        this.currentCommand.reject(new Error(line));
        this.currentCommand = null;
        this.currentResponseLines = [];
        this.sendNext();
      }
    } else {
      if (this.currentCommand) {
        this.currentResponseLines.push(line);
      }
    }
  }

  public sendCommand(cmd: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        return reject(new Error('MPD is not connected'));
      }
      this.commandQueue.push({ cmd, resolve, reject });
      if (!this.currentCommand) {
        this.sendNext();
      }
    });
  }

  private sendNext() {
    if (this.commandQueue.length === 0) return;
    this.currentCommand = this.commandQueue.shift()!;
    this.currentResponseLines = [];
    try {
      this.socket?.write(`${this.currentCommand.cmd}\n`);
    } catch (err) {
      this.currentCommand.reject(err as Error);
      this.currentCommand = null;
      this.sendNext();
    }
  }

  // Helper parsers
  public async getStatus(): Promise<MpdServerStatus> {
    const lines = await this.sendCommand('status');
    const statusMap: Record<string, string> = {};
    for (const line of lines) {
      const idx = line.indexOf(': ');
      if (idx !== -1) {
        const key = line.slice(0, idx);
        const val = line.slice(idx + 2);
        statusMap[key] = val;
      }
    }

    let currentTrack;
    try {
      currentTrack = await this.getCurrentSong();
    } catch {
      // Ignored
    }

    const state = (statusMap['state'] as 'play' | 'pause' | 'stop') || 'stop';
    const elapsed = parseFloat(statusMap['elapsed'] || '0');
    const duration = parseFloat(statusMap['duration'] || currentTrack?.duration?.toString() || '0');

    return {
      state,
      songIndex: parseInt(statusMap['song'] || '0', 10),
      songId: statusMap['songid'] || currentTrack?.id || '',
      elapsed: Math.floor(elapsed),
      duration: Math.floor(duration),
      volume: parseInt(statusMap['volume'] || '85', 10),
      repeat: statusMap['repeat'] === '1',
      random: statusMap['random'] === '1',
      single: statusMap['single'] === '1',
      consume: statusMap['consume'] === '1',
      bitRate: statusMap['bitrate'] ? `${statusMap['bitrate']} kbps` : undefined,
      audioFormat: statusMap['audio'],
      queueCount: parseInt(statusMap['playlistlength'] || '0', 10),
      currentTrack,
    };
  }

  public async getCurrentSong() {
    const lines = await this.sendCommand('currentsong');
    return this.parseSong(lines);
  }

  public async getQueue() {
    const lines = await this.sendCommand('playlistinfo');
    return this.parseSongsList(lines);
  }

  public async getLibrary(path = '') {
    const cmd = path ? `lsinfo "${path}"` : 'lsinfo';
    const lines = await this.sendCommand(cmd);
    const folders: string[] = [];
    const songs: any[] = [];
    let curObj: Record<string, string> = {};

    for (const line of lines) {
      if (line.startsWith('directory: ')) {
        folders.push(line.replace('directory: ', ''));
      } else if (line.startsWith('file: ')) {
        if (curObj['file']) {
          songs.push(this.formatSongObject(curObj));
          curObj = {};
        }
        curObj['file'] = line.replace('file: ', '');
      } else {
        const idx = line.indexOf(': ');
        if (idx !== -1) {
          curObj[line.slice(0, idx)] = line.slice(idx + 2);
        }
      }
    }
    if (curObj['file']) {
      songs.push(this.formatSongObject(curObj));
    }

    return { folders, songs };
  }

  private parseSong(lines: string[]) {
    if (lines.length === 0) return undefined;
    const map: Record<string, string> = {};
    for (const line of lines) {
      const idx = line.indexOf(': ');
      if (idx !== -1) {
        map[line.slice(0, idx)] = line.slice(idx + 2);
      }
    }
    return this.formatSongObject(map);
  }

  private parseSongsList(lines: string[]) {
    const songs: any[] = [];
    let curObj: Record<string, string> = {};
    for (const line of lines) {
      if (line.startsWith('file: ')) {
        if (curObj['file']) {
          songs.push(this.formatSongObject(curObj));
          curObj = {};
        }
        curObj['file'] = line.replace('file: ', '');
      } else {
        const idx = line.indexOf(': ');
        if (idx !== -1) {
          curObj[line.slice(0, idx)] = line.slice(idx + 2);
        }
      }
    }
    if (curObj['file']) {
      songs.push(this.formatSongObject(curObj));
    }
    return songs;
  }

  private formatSongObject(map: Record<string, string>) {
    const file = map['file'] || '';
    const title = map['Title'] || file.split('/').pop() || 'Bilinmeyen Parça';
    return {
      id: map['Id'] || map['id'] || file,
      file,
      title,
      artist: map['Artist'] || 'Bilinmeyen Sanatçı',
      album: map['Album'] || 'Bilinmeyen Albüm',
      duration: parseInt(map['Time'] || '0', 10),
      track: map['Track'],
      date: map['Date'],
      genre: map['Genre'],
    };
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(async () => {
      if (!this.isConnected) return;
      try {
        const status = await this.getStatus();
        this.emit('status', status);
      } catch (e) {
        // Polling error
      }
    }, 1000);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
