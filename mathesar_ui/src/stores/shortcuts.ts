import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

export interface ShortcutsMode {
  handleKeyDown: (event: KeyboardEvent) => Promise<void>;
}

export interface ShortcutsHandler {
  handleKeyDown: (event: KeyboardEvent) => Promise<void>;
  registerMode: (name: string, mode: ShortcutsMode | undefined) => void;
  unregisterMode: (name: string) => void;
  enableMode: (name: string) => void;
  disableMode: (name: string) => void;
}

const contextKey = Symbol('KeyboardShortcutsHandlerStore');

export function setNewShortcutsHandlerStoreInContext(): Writable<
  ShortcutsHandler | undefined
> {
  const controller = writable<ShortcutsHandler | undefined>(undefined);
  setContext(contextKey, controller);
  return controller;
}

export function getShortcutsHandlerStoreFromContext():
  | Writable<ShortcutsHandler | undefined>
  | undefined {
  return getContext(contextKey);
}
