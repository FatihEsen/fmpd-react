/**
 * Queue operations that have to be translated into MPD `move` commands.
 *
 * MPD's `move FROM TO` puts the song at position FROM into the FINAL
 * position TO and shifts everything in between. The helpers below simulate
 * that shift locally so a series of moves can be expressed with correct
 * source positions - otherwise every second command would address the
 * wrong song.
 */

import { Song } from '../types';
import { mpdCommands } from './mpdCommands';

/**
 * Moves the selected songs one position up (or down) in the queue.
 * Contiguous blocks of selected songs move as a single unit.
 */
export function buildMoveCommands(
  queue: Song[],
  selectedIds: Set<string>,
  direction: 'up' | 'down'
): string[] {
  const working = [...queue];
  const selected = queue.filter((s) => selectedIds.has(s.id));

  // Moving down has to start from the bottom, otherwise the entries below
  // would already have shifted when their turn comes.
  const ordered = direction === 'up' ? selected : [...selected].reverse();

  const commands: string[] = [];
  for (const entry of ordered) {
    const from = working.findIndex((s) => s.id === entry.id);
    if (from === -1) continue;

    const neighbour = direction === 'up' ? from - 1 : from + 1;
    if (neighbour < 0 || neighbour >= working.length) continue;
    // The neighbour is part of the selection as well - the whole block is
    // already handled by its first element.
    if (selectedIds.has(working[neighbour].id)) continue;

    commands.push(mpdCommands.move(from, neighbour));

    const [moved] = working.splice(from, 1);
    working.splice(neighbour, 0, moved);
  }

  return commands;
}

/**
 * Moves the selected songs right behind the currently playing one.
 */
export function buildQueueNextCommands(
  queue: Song[],
  selectedIds: Set<string>,
  insertAt: number
): string[] {
  const working = [...queue];
  const selected = queue.filter((s) => selectedIds.has(s.id));

  const commands: string[] = [];
  for (const [order, entry] of selected.entries()) {
    const from = working.findIndex((s) => s.id === entry.id);
    if (from === -1) continue;

    // Every song of the block gets its own slot, otherwise the last one
    // that is moved would end up in front of the others.
    const to = Math.min(
      Math.max(insertAt + order, 0),
      Math.max(0, queue.length - 1)
    );
    if (to === from) continue;

    commands.push(mpdCommands.move(from, to));

    const [moved] = working.splice(from, 1);
    working.splice(to, 0, moved);
  }

  return commands;
}

/**
 * Deletes the selected songs from the playlist.
 *
 * MPD's `delete` works on 0-based playlist positions, so the positions have
 * to be resolved from the current queue. They are deleted from the bottom
 * to the top, otherwise every deletion would shift the positions of the
 * songs that are still queued for removal.
 */
export function buildDeleteCommands(
  queue: Song[],
  selectedIds: Set<string>
): string[] {
  const positions = queue
    .map((song, index) => (selectedIds.has(song.id) ? index : -1))
    .filter((index) => index >= 0)
    .sort((a, b) => b - a);

  return positions.map((position) => mpdCommands.deleteAt(position));
}
