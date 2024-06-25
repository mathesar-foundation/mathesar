/**
 * A stricter definition KeyboardEvent['key']. We'll add more variants as we
 * need them.
 */
type Key = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Tab';

type Mod = 'Ctrl' | 'Shift' | 'Alt' | 'Meta';

export class KeyboardShortcut {
  ctrl: boolean;

  shift: boolean;

  alt: boolean;

  meta: boolean;

  key: Key;

  constructor(props: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
    key: Key;
  }) {
    this.ctrl = props.ctrl;
    this.shift = props.shift;
    this.alt = props.alt;
    this.meta = props.meta;
    this.key = props.key;
  }

  static fromKey(key: Key, mods: Mod[] = []): KeyboardShortcut {
    return new KeyboardShortcut({
      ctrl: mods.includes('Ctrl'),
      shift: mods.includes('Shift'),
      alt: mods.includes('Alt'),
      meta: mods.includes('Meta'),
      key,
    });
  }

  static fromKeyboardEvent(event: KeyboardEvent): KeyboardShortcut {
    return new KeyboardShortcut({
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
      key: event.key as Key,
    });
  }

  toString(): string {
    return [
      ...(this.ctrl ? ['Ctrl'] : []),
      ...(this.shift ? ['Shift'] : []),
      ...(this.alt ? ['Alt'] : []),
      ...(this.meta ? ['Meta'] : []),
      this.key,
    ].join('+');
  }
}
