import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

export interface ClipboardHandler {
  shouldHandleCopy: (event: ClipboardEvent) => boolean;
  shouldHandlePaste: (event: ClipboardEvent) => boolean;
  handleCopy: (event: ClipboardEvent) => void;
  handlePaste: (event: ClipboardEvent) => Promise<void>;
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
