import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

export interface ClipboardHandler {
  handleCopy: (event: ClipboardEvent) => void;
}

const contextKey = Symbol('ClipboardHandlerStore');

export function setNewClipboardHandlerStoreInContext(): Writable<
  ClipboardHandler | undefined
> {
  const controller = writable<ClipboardHandler | undefined>(undefined);
  setContext(contextKey, controller);
  return controller;
}

export function getClipboardHandlerStoreFromContext():
  | Writable<ClipboardHandler | undefined>
  | undefined {
  return getContext(contextKey);
}
