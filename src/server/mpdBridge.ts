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

interface CommandEntry {
  cmd: string;
  resolve: (res: string[]) => void;
  reject: (err: Error) => void;
  timer?: NodeJS.Timeout;
}

export class MpdBridgeClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private password?: string;
  private isConnected = false;
  private buffer = '';
  private commandQueue: CommandEntry[] = [];
  private currentCommand: CommandEntry | null = null;
  private currentResponseLines: string[] = [];
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  /** Set to true by an explicit disconnect() so we stop auto-reconnecting. */
  private manuallyClosed = false;
  /** Every command must answer within this window, otherwise it is rejected. */
  private commandTimeoutMs = 10000;

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

  /**
   * Opens the TCP connection to MPD and resolves with the connection result.
   * A failed attempt does NOT disable the client: the socket is retried with
   * an exponential backoff until disconnect() is called explicitly.
   */
  public connect(): Promise<boolean> {
    this.manuallyClosed = false;
    this.clearReconnectTimer();

    return new Promise((resolve) => {
      let settled = false;
      let failTimer: NodeJS.Timeout | undefined;
      let onGreeting: (greeting: string) => void = () => {};

      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        if (failTimer) clearTimeout(failTimer);
        // Never leave a stale greeting listener behind: several failed
        // connection attempts would otherwise pile up and all fire at once
        // as soon as MPD comes back, emitting 'connected' many times.
        this.removeListener('greeting', onGreeting);
        resolve(value);
      };

      this.teardownSocket();

      const socket = new net.Socket();
      this.socket = socket;
      socket.setTimeout(8000);

      onGreeting = (greeting: string) => {
        if (!greeting.startsWith('OK MPD')) {
          settle(false);
          return;
        }
        const wasConnected = this.isConnected;
        this.isConnected = true;
        this.reconnectAttempts = 0;

        if (!wasConnected) {
          this.emit('connected', greeting);
        }

        if (this.password) {
          this.sendCommand(`password ${this.password}`).then(
            () => settle(true),
            () => settle(false)
          );
        } else {
          settle(true);
        }

        this.startPolling();
      };

      this.once('greeting', onGreeting);

      failTimer = setTimeout(() => {
        if (!this.isConnected) {
          settle(false);
        }
      }, 5000);

      socket.on('data', (chunk) => {
        this.buffer += chunk.toString('utf-8');
        this.processBuffer();
      });

      socket.on('error', (err) => {
        const code = (err as NodeJS.ErrnoException)?.code;
        console.warn(
          `[MPD Socket] Cannot connect to ${this.host}:${this.port} (MPD not running?):`,
          err?.message || code || 'unknown error'
        );
        this.emit('error', err);
        settle(false);
      });

      socket.on('close', () => {
        this.handleSocketClosed();
      });

      socket.on('timeout', () => {
        if (!this.isConnected) {
          socket.destroy();
          settle(false);
        }
      });

      socket.connect(this.port, this.host, () => {
        // Socket opened, waiting for the 'OK MPD ...' greeting
      });
    });
  }

  /** Explicitly closes the connection and disables auto-reconnect. */
  public disconnect() {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.teardownSocket();
    this.isConnected = false;
    this.stopPolling();
    this.failPendingCommands(new Error('MPD connection closed'));
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  /** Destroys the socket without emitting 'disconnected'. */
  private teardownSocket() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    try {
      this.socket.destroy();
    } catch {
      // already destroyed
    }
    this.socket = null;
  }

  /** Called when the socket closes for any reason. */
  private handleSocketClosed() {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.socket = null;
    this.stopPolling();
    this.failPendingCommands(new Error('MPD connection lost'));

    if (wasConnected) {
      this.emit('disconnected');
    }

    if (!this.manuallyClosed) {
      this.scheduleReconnect();
    }
  }

  /** Retries the connection with an exponential backoff (1s, 2s, 4s ... 10s). */
  private scheduleReconnect() {
    if (this.reconnectTimer || this.manuallyClosed) return;

    this.reconnectAttempts += 1;
    const delay = Math.min(10000, 1000 * Math.pow(2, this.reconnectAttempts - 1));

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, delay);

    // Never keep the process alive just for a reconnect attempt.
    this.reconnectTimer.unref?.();

    console.log(`[MPD Socket] Reconnecting to ${this.host}:${this.port} in ${delay}ms`);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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
        const finished = this.currentCommand;
        const lines = this.currentResponseLines;
        this.currentCommand = null;
        this.currentResponseLines = [];
        if (finished.timer) clearTimeout(finished.timer);
        finished.resolve(lines);
        this.sendNext();
      }
    } else if (line.startsWith('ACK')) {
      if (this.currentCommand) {
        const failed = this.currentCommand;
        this.currentCommand = null;
        this.currentResponseLines = [];
        if (failed.timer) clearTimeout(failed.timer);
        failed.reject(new Error(line));
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

      const entry: CommandEntry = { cmd, resolve, reject };

      // A command that never gets an answer must not hang the caller
      // (REST handlers, the polling loop, ...) forever.
      entry.timer = setTimeout(() => {
        const queuedAt = this.commandQueue.indexOf(entry);
        if (queuedAt !== -1) {
          this.commandQueue.splice(queuedAt, 1);
          entry.reject(new Error(`MPD command timed out: ${cmd}`));
          return;
        }
        if (this.currentCommand === entry) {
          this.currentCommand = null;
          this.currentResponseLines = [];
          entry.reject(new Error(`MPD command timed out: ${cmd}`));
          this.sendNext();
        }
      }, this.commandTimeoutMs);
      entry.timer.unref?.();

      this.commandQueue.push(entry);
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
      const failed = this.currentCommand;
      this.currentCommand = null;
      if (failed.timer) clearTimeout(failed.timer);
      failed.reject(err as Error);
      this.sendNext();
    }
  }

  /** Rejects the in-flight command and every queued one. */
  private failPendingCommands(error: Error) {
    if (this.currentCommand) {
      const failed = this.currentCommand;
      this.currentCommand = null;
      this.currentResponseLines = [];
      if (failed.timer) clearTimeout(failed.timer);
      failed.reject(error);
    }
    const queued = this.commandQueue.splice(0, this.commandQueue.length);
    for (const entry of queued) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.reject(error);
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
    // MPD commands: lsinfo or listfiles
    const safePath = path ? `"${path.replace(/"/g, '\\"')}"` : '""';
    let lines: string[] = [];
    try {
      lines = await this.sendCommand(path ? `lsinfo ${safePath}` : 'lsinfo');
    } catch {
      try {
        lines = await this.sendCommand(path ? `listfiles ${safePath}` : 'listfiles');
      } catch {
        lines = [];
      }
    }

    const folders: string[] = [];
    const songs: any[] = [];
    let curObj: Record<string, string> = {};

    for (const line of lines) {
      if (line.startsWith('directory: ')) {
        folders.push(line.replace('directory: ', '').trim());
      } else if (line.startsWith('file: ')) {
        if (curObj['file']) {
          songs.push(this.formatSongObject(curObj));
          curObj = {};
        }
        curObj['file'] = line.replace('file: ', '').trim();
      } else {
        const idx = line.indexOf(': ');
        if (idx !== -1) {
          curObj[line.slice(0, idx)] = line.slice(idx + 2).trim();
        }
      }
    }
    if (curObj['file']) {
      songs.push(this.formatSongObject(curObj));
    }

    return { folders, songs };
  }

  public async getAllSongs(): Promise<any[]> {
    // Fetch all files from MPD database
    try {
      const lines = await this.sendCommand('listallinfo');
      return this.parseSongsList(lines);
    } catch {
      try {
        const lines = await this.sendCommand('search "" ""');
        return this.parseSongsList(lines);
      } catch {
        return [];
      }
    }
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
