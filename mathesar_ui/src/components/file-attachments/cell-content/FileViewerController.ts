import { type Writable, get, writable } from 'svelte/store';

import type { FileManifest } from '@mathesar/api/rpc/records';
import type { FileDetailDropdownController } from '@mathesar/components/file-attachments/file-detail-dropdown/FileDetailDropdownController';
import type { LightboxController } from '@mathesar/components/file-attachments/lightbox/LightboxController';
import { onAnyUiInteraction } from '@mathesar/utils/onAnyUiInteraction';
import {
  assertExhaustive,
  isDefinedNonNullable,
} from '@mathesar-component-library';

import { fetchImage, getFileViewerType } from '../fileUtils';

export class FileViewerController {
  manifest: FileManifest;

  canOpenViewer: Writable<boolean>;

  isLoading: Writable<boolean> = writable(false);

  private imageElement: HTMLImageElement | undefined;

  private lightboxController: LightboxController | undefined;

  private fileDetailController: FileDetailDropdownController | undefined;

  private getTrigger: () => HTMLElement | undefined = () => undefined;

  private removeFile: () => unknown;

  private onClose: () => unknown;

  constructor(props: {
    manifest: FileManifest;
    canOpen?: boolean;
    removeFile: () => unknown;
    lightboxController: LightboxController | undefined;
    fileDetailController: FileDetailDropdownController | undefined;
    onClose: () => unknown;
  }) {
    this.manifest = props.manifest;
    this.canOpenViewer = writable(
      isDefinedNonNullable(props.canOpen) ? props.canOpen : true,
    );
    this.removeFile = props.removeFile;
    this.lightboxController = props.lightboxController;
    this.fileDetailController = props.fileDetailController;
    this.onClose = props.onClose;
  }

  setTriggerRetriever(getTrigger: () => HTMLElement | undefined) {
    this.getTrigger = getTrigger;
  }

  private async openImageFileViewer() {
    if (!this.imageElement) {
      let uiInteraction = false;
      onAnyUiInteraction(() => {
        uiInteraction = true;
      }, ['pointerdown', 'keydown']);

      this.isLoading.set(true);
      this.imageElement = await fetchImage(this.manifest.direct);
      this.isLoading.set(false);

      // If the user has interacted before the lightbox
      // opened, do not open the lightbox.
      if (uiInteraction) return;
    }

    if (!this.imageElement) {
      throw new Error('Failed to load image');
    }

    if (!this.lightboxController) return;

    const trigger = this.getTrigger();
    this.lightboxController.open({
      imageElement: this.imageElement,
      zoomOrigin: trigger?.getBoundingClientRect(),
      fileManifest: this.manifest,
      removeFile: () => this.removeFile(),
      onClose: () => this.onClose(),
    });
  }

  private openFileDetailDropdown() {
    if (!this.fileDetailController) return;

    const trigger = this.getTrigger();
    if (!trigger) return;

    this.fileDetailController.open({
      trigger,
      fileManifest: this.manifest,
      removeFile: () => this.removeFile(),
      onClose: () => this.onClose(),
    });
  }

  async openFileViewer() {
    if (!get(this.canOpenViewer)) {
      return;
    }

    const viewerType = getFileViewerType(this.manifest);
    if (viewerType === 'image') {
      await this.openImageFileViewer();
    } else if (viewerType === 'default') {
      this.openFileDetailDropdown();
    } else {
      assertExhaustive(viewerType);
    }
  }

  close() {
    this.lightboxController?.close();
    this.fileDetailController?.close();
  }
}
