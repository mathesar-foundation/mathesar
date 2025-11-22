import type { Writable } from 'svelte/store';

import { KeyboardShortcut } from '@mathesar/utils/KeyboardShortcut';

import { Direction } from './selection/Direction';
import type SheetSelection from './selection/SheetSelection';
import { autoScroll } from './sheetScrollingUtils';

function move(selection: Writable<SheetSelection>, direction: Direction) {
  selection.update((s) => s.collapsedAndMoved(direction));
  void autoScroll();
}

function resize(selection: Writable<SheetSelection>, direction: Direction) {
  selection.update((s) => s.resized(direction));
  void autoScroll();
}

function key(...args: Parameters<typeof KeyboardShortcut.fromKey>) {
  return KeyboardShortcut.fromKey(...args).toString();
}

const shortcutMapData: [string, (s: Writable<SheetSelection>) => void][] = [
  [key('ArrowUp'), (s) => move(s, Direction.Up)],
  [key('ArrowDown'), (s) => move(s, Direction.Down)],
  [key('ArrowLeft'), (s) => move(s, Direction.Left)],
  [key('ArrowRight'), (s) => move(s, Direction.Right)],
  [key('Tab'), (s) => move(s, Direction.Right)],
  [key('Tab', ['Shift']), (s) => move(s, Direction.Left)],
  [key('ArrowUp', ['Shift']), (s) => resize(s, Direction.Up)],
  [key('ArrowDown', ['Shift']), (s) => resize(s, Direction.Down)],
  [key('ArrowLeft', ['Shift']), (s) => resize(s, Direction.Left)],
  [key('ArrowRight', ['Shift']), (s) => resize(s, Direction.Right)],
];

const shortcutMap = new Map(shortcutMapData);

export function handleKeyboardEventOnCell(
  event: KeyboardEvent,
  selection: Writable<SheetSelection>,
): void {
  const shortcut = KeyboardShortcut.fromKeyboardEvent(event);
  const action = shortcutMap.get(shortcut.toString());
  if (action) {
    event.preventDefault();
    action(selection);
  }
}
