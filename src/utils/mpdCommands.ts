/**
 * Helpers for building safe MPD protocol commands.
 *
 * MPD quotes strings with double quotes and escapes `\` and `"` with a
 * backslash. Escaping only the quote character (as the old code did) breaks
 * on file names that contain a backslash.
 */

/** Quotes a value for the MPD protocol. */
export function quoteMpdArg(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * MPD playlist positions are 0-based and `move` puts the song into the
 * FINAL position (verified against MPD 0.24):
 *   move 0 3 on [A B C D E] -> [B C D A E]
 * The same position space is used by `play` and `delete` - NOT the song id.
 */
export const mpdCommands = {
  add: (file: string) => `add ${quoteMpdArg(file)}`,
  /** Removes the song at the given 0-based playlist position. */
  deleteAt: (position: number) => `delete ${position}`,
  move: (from: number, to: number) => `move ${from} ${to}`,
  clear: () => 'clear',
  play: (position?: number) => (position === undefined ? 'play' : `play ${position}`),
  pause: (paused: boolean) => `pause ${paused ? 1 : 0}`,
  stop: () => 'stop',
  next: () => 'next',
  previous: () => 'previous',
  seek: (seconds: number) => `seekcur ${Math.max(0, Math.floor(seconds))}`,
  setVolume: (volume: number) => `setvol ${Math.round(volume)}`,
  random: (on: boolean) => `random ${on ? 1 : 0}`,
  repeat: (on: boolean) => `repeat ${on ? 1 : 0}`,
  single: (on: boolean) => `single ${on ? 1 : 0}`,
  consume: (on: boolean) => `consume ${on ? 1 : 0}`,
  savePlaylist: (name: string) => `save ${quoteMpdArg(name)}`,
  update: () => 'update',
};
