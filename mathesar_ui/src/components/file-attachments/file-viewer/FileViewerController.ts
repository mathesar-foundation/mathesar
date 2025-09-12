import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  get,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';

export default class FileViewerController
  implements Readable<FileManifest | undefined>
{
  private file = writable<FileManifest | undefined>(undefined);

  private fileRemover = writable<(() => void) | undefined>(undefined);

  open(file: FileManifest, options: { removeFile?: () => void } = {}) {
    this.file.set(file);
    this.fileRemover.set(options.removeFile);
  }

  close() {
    this.file.set(undefined);
  }

  removeFile() {
    const remove = get(this.fileRemover);
    remove?.();
  }

  subscribe(subscription: Subscriber<FileManifest | undefined>): Unsubscriber {
    return this.file.subscribe(subscription);
  }
}
