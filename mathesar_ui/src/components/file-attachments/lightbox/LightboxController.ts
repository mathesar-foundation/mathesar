import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  get,
  writable,
} from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';
import { makeContext } from '@mathesar/component-library/common/utils/contextUtils';

export interface LightboxProps {
  /** The main image being displayed */
  imageElement: HTMLImageElement;
  /** If provided, the lightbox will zoom in/out from this rect */
  zoomOrigin?: DOMRect;
  fileManifest: FileManifest;
  /** Triggers removal of the file from where it is stored. No confirmation. */
  removeFile: () => void;
  onClose: () => unknown;
}

export class LightboxController implements Readable<LightboxProps | undefined> {
  private props = writable<LightboxProps | undefined>(undefined);

  open(props: LightboxProps) {
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

  subscribe(subscription: Subscriber<LightboxProps | undefined>): Unsubscriber {
    return this.props.subscribe(subscription);
  }
}

export const lightboxContext = makeContext<LightboxController>();
