import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

import { ensureReadable } from '@mathesar/component-library';

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

export function getClipboardHandlerStoreFromContext(): Readable<
  ClipboardHandler | undefined
> {
  return ensureReadable(
    getContext<Readable<ClipboardHandler> | undefined>(contextKey),
  );
}
