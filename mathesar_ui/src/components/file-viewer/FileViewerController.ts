import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';

export default class FileViewerController
  implements Readable<FileManifest | undefined>
{
  private file = writable<FileManifest | undefined>(undefined);

  open(file: FileManifest) {
    this.file.set(file);
  }

  close() {
    this.file.set(undefined);
  }

  subscribe(subscription: Subscriber<FileManifest | undefined>): Unsubscriber {
    return this.file.subscribe(subscription);
  }
}
