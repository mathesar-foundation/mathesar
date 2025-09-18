import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';
import { makeContext } from '@mathesar/contexts/utils';

export interface FileDetailDropdownProps {
  trigger: HTMLElement;
  fileManifest: FileManifest;
  /** Triggers removal of the file from where it is stored. No confirmation. */
  removeFile: () => void;
}

export class FileDetailDropdownController
  implements Readable<FileDetailDropdownProps | undefined>
{
  private props = writable<FileDetailDropdownProps | undefined>(undefined);

  open(props: FileDetailDropdownProps) {
    this.props.set(props);
  }

  close() {
    this.props.set(undefined);
  }

  subscribe(
    subscription: Subscriber<FileDetailDropdownProps | undefined>,
  ): Unsubscriber {
    return this.props.subscribe(subscription);
  }
}

export const fileDetailDropdownContext =
  makeContext<FileDetailDropdownController>();
