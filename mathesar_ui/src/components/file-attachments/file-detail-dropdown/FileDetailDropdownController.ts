import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  get,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';
import { makeContext } from '@mathesar/contexts/utils';

export interface FileDetailDropdownProps {
  trigger: HTMLElement;
  fileManifest: FileManifest;
  /** Triggers removal of the file from where it is stored. No confirmation. */
  removeFile: () => void;
  onClose: () => unknown;
}

export class FileDetailDropdownController
  implements Readable<FileDetailDropdownProps | undefined>
{
  private props = writable<FileDetailDropdownProps | undefined>(undefined);

  open(props: FileDetailDropdownProps) {
    this.props.set(props);
  }

  close() {
    const props = get(this.props);
    if (props !== undefined) {
      const onClose = get(this.props)?.onClose;
      this.props.set(undefined);
      onClose?.();
    }
  }

  subscribe(
    subscription: Subscriber<FileDetailDropdownProps | undefined>,
  ): Unsubscriber {
    return this.props.subscribe(subscription);
  }
}

export const fileDetailDropdownContext =
  makeContext<FileDetailDropdownController>();
