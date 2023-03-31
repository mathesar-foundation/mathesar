import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

import { ensureReadable } from '@mathesar/component-library';

export type CopyingStrategy = 'raw' | 'formatted';

export interface ClipboardController {
  copy: (strategy: CopyingStrategy) => Promise<void>;
}

const contextKey = Symbol('ClipboardController');

export function setNewClipboardControllerStoreInContext(): Writable<
  ClipboardController | undefined
> {
  const controller = writable<ClipboardController | undefined>(undefined);
  setContext(contextKey, controller);
  return controller;
}

export function getClipboardControllerStoreFromContext(): Readable<
  ClipboardController | undefined
> {
  return ensureReadable(
    getContext<Readable<ClipboardController> | undefined>(contextKey),
  );
}
