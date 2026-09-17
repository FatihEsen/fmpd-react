/**
 * Audio Engine for FMPD
 * Supports both HTML5 Live Stream Audio & Web Audio Ghibli Synthesizer
 */

import { Song } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private synthInterval: any = null;
  private currentSong: Song | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private volume = 0.85; // 0.0 to 1.0
  private onTrackEnded?: () => void;

  private noteSequences: Record<string, number[]> = {
    'ghibli-1': [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 293.66], // One Summer's Day
    'ghibli-2': [293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23], // Merry-Go-Round of Life
    'ghibli-3': [329.63, 392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 392.0], // Path of the Wind
    'ghibli-4': [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 261.63, 196.0],  // Legend of Ashitaka
    'ghibli-5': [349.23, 440.0, 523.25, 698.46, 659.25, 523.25, 440.0, 392.0], // Town with an Ocean View
    'ghibli-6': [261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63],  // Carrying You
    'ghibli-7': [293.66, 369.99, 440.0, 554.37, 493.88, 440.0, 369.99, 293.66], // Bygone Days
    'ghibli-8': [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 392.0], // Ponyo
  };

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setEndCallback(cb: () => void) {
    this.onTrackEnded = cb;
  }

  public setVolume(volPercent: number) {
    this.volume = Math.max(0, Math.min(1, volPercent / 100));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.volume = this.volume;
    }
  }

  public play(song: Song, startElapsed = 0) {
    this.initAudioContext();
    this.stopCurrent();

    this.currentSong = song;
    this.isPlaying = true;

    // Check if this is an external HTTP streaming URL
    const isHttpStream = song.file.startsWith('http://') || song.file.startsWith('https://');

    if (isHttpStream) {
      this.playHttpStream(song.file);
    } else {
      this.startGhibliSynthesizer(song, startElapsed);
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
        // Stream format error fallback to ambient synth
        if (this.currentSong) {
          this.startGhibliSynthesizer(this.currentSong, 0);
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented or network error
        });
      }

      this.currentHtmlAudio = audio;
    } catch {
      if (this.currentSong) {
        this.startGhibliSynthesizer(this.currentSong, 0);
      }
    }
  }

  private startGhibliSynthesizer(song: Song, _startElapsed: number) {
    if (!this.audioCtx || !this.masterGain) return;

    const baseSeq = this.noteSequences[song.id] || [261.63, 329.63, 392.0, 523.25, 440.0, 349.23, 293.66, 329.63];
    let noteIdx = 0;

    // Play an immediate warm chord
    this.playTone(baseSeq[0], 1.6, 'sine', 0.28);
    this.playTone(baseSeq[1] * 0.5, 2.0, 'triangle', 0.22);
    this.playTone(baseSeq[2], 1.8, 'sine', 0.20);

    // Schedule peaceful melodic intervals (Ghibli piano/chime style)
    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx || !this.masterGain) return;

      const freq = baseSeq[noteIdx % baseSeq.length];
      const harmonyFreq = baseSeq[(noteIdx + 2) % baseSeq.length] * 0.5;

      // Bell/Piano chime
      this.playTone(freq, 1.4, 'sine', 0.25);
      // Soft warm acoustic bass note
      if (noteIdx % 2 === 0) {
        this.playTone(harmonyFreq, 2.2, 'triangle', 0.18);
        this.playTone(freq * 1.5, 1.2, 'sine', 0.12);
      }

      noteIdx++;
    }, 1100);
  }

  private playTone(freq: number, duration: number, type: OscillatorType, gainMultiplier = 0.2) {
    if (!this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Smooth ADSR envelope for organic sound
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainMultiplier, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch {
      // Audio node cleanup
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
    }
  }

  public resume() {
    if (!this.currentSong) return;
    this.initAudioContext();
    this.isPlaying = true;

    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.play().catch(() => {});
    } else {
      this.startGhibliSynthesizer(this.currentSong, 0);
    }
  }

  public stop() {
    this.stopCurrent();
    this.currentSong = null;
  }

  private stopCurrent() {
    this.isPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
      this.currentHtmlAudio.src = '';
      this.currentHtmlAudio = null;
    }
  }
}

export const audioEngine = new AudioEngine();
