import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';
import { makeContext } from '@mathesar/contexts/utils';

export interface LightboxProps {
  /** The main image being displayed */
  imageElement: HTMLImageElement;
  /** The DOM node of the thumbnail from which the lightbox was opened */
  thumbnailElement?: HTMLImageElement;
  fileManifest: FileManifest;
  /** Triggers removal of the file from where it is stored. No confirmation. */
  removeFile: () => void;
}

export class LightboxController implements Readable<LightboxProps | undefined> {
  private props = writable<LightboxProps | undefined>(undefined);

  open(props: LightboxProps) {
    this.props.set(props);
  }

  close() {
    this.props.set(undefined);
  }

  subscribe(subscription: Subscriber<LightboxProps | undefined>): Unsubscriber {
    return this.props.subscribe(subscription);
  }
}

export const lightboxContext = makeContext<LightboxController>();
