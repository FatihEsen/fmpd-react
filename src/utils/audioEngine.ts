/**
 * Audio Engine for FMPD
 * Clean audio playback manager for direct HTTP/HTTPS audio streams & MPD streams.
 * Prevents any secondary synth tones, beep overlays, or phantom audio loops.
 */

import { Song } from '../types';

class AudioEngine {
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private isPlaying = false;
  private volume = 0.85; // 0.0 to 1.0
  private onTrackEnded?: () => void;

  public setEndCallback(cb: () => void) {
    this.onTrackEnded = cb;
  }

  public setVolume(volPercent: number) {
    this.volume = Math.max(0, Math.min(1, volPercent / 100));
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.volume = this.volume;
    }
  }

  public play(song: Song, _startElapsed = 0) {
    this.stopCurrent();

    this.currentSong = song;
    this.isPlaying = true;

    // Check if this is an external HTTP/HTTPS audio streaming URL
    const isHttpStream =
      song.file.startsWith('http://') ||
      song.file.startsWith('https://') ||
      song.file.startsWith('data:audio');

    if (isHttpStream) {
      this.playHttpStream(song.file);
    }
  }

  private playHttpStream(url: string) {
    try {
      const audio = new Audio();
      audio.src = url;
      audio.crossOrigin = 'anonymous';
      audio.volume = this.volume;
      audio.autoplay = true;

      audio.onended = () => {
        if (this.onTrackEnded) this.onTrackEnded();
      };

      audio.onerror = () => {
        // Quietly handle stream errors without injecting any synth noises
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay prevented or network stream paused
        });
      }

      this.currentHtmlAudio = audio;
    } catch {
      // Ignore
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
    }
  }

  public resume() {
    if (!this.currentSong) return;
    this.isPlaying = true;

    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.play().catch(() => {});
    }
  }

  public stop() {
    this.stopCurrent();
    this.currentSong = null;
  }

  private stopCurrent() {
    this.isPlaying = false;
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.src = '';
        this.currentHtmlAudio.load();
      } catch {
        // Ignore cleanup errors
      }
      this.currentHtmlAudio = null;
    }
  }
}

export const audioEngine = new AudioEngine();
