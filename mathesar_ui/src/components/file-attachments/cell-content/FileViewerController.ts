import { type Writable, get, writable } from 'svelte/store';

import type { FileAttachmentRequestParams } from '@mathesar/api/rest/fileAttachments';
import type { FileManifest } from '@mathesar/api/rpc/records';
import type { FileDetailDropdownController } from '@mathesar/components/file-attachments/file-detail-dropdown/FileDetailDropdownController';
import type { LightboxController } from '@mathesar/components/file-attachments/lightbox/LightboxController';
import { onAnyUiInteraction } from '@mathesar/utils/onAnyUiInteraction';
import {
  assertExhaustive,
  isDefinedNonNullable,
} from '@mathesar-component-library';

import {
  FileManifestWithRequestParams,
  fetchImage,
  getFileViewerType,
} from '../fileUtils';

export class FileViewerController {
  private rawManifest: FileManifest;

  manifestWithRequestParams: FileManifestWithRequestParams;

  canOpenViewer: Writable<boolean>;

  isLoading: Writable<boolean> = writable(false);

  private imageElement: HTMLImageElement | undefined;

  private lightboxController: LightboxController | undefined;

  private fileDetailController: FileDetailDropdownController | undefined;

  private getTrigger: () => HTMLElement | undefined = () => undefined;

  private removeFile: () => unknown;

  private onClose: () => unknown;

  constructor(props: {
    rawManifest: FileManifest;
    canOpen?: boolean;
    removeFile: () => unknown;
    lightboxController: LightboxController | undefined;
    fileDetailController: FileDetailDropdownController | undefined;
    fileRequestParams?: FileAttachmentRequestParams;
    onClose: () => unknown;
  }) {
    this.rawManifest = props.rawManifest;
    this.canOpenViewer = writable(
      isDefinedNonNullable(props.canOpen) ? props.canOpen : true,
    );
    this.removeFile = props.removeFile;
    this.lightboxController = props.lightboxController;
    this.fileDetailController = props.fileDetailController;
    this.manifestWithRequestParams = new FileManifestWithRequestParams(
      this.rawManifest,
      props.fileRequestParams,
    );
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
      this.imageElement = await fetchImage(
        this.manifestWithRequestParams.direct,
      );
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
      fileManifestWithRequestParams: this.manifestWithRequestParams,
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
      fileManifestWithRequestParams: this.manifestWithRequestParams,
      removeFile: () => this.removeFile(),
      onClose: () => this.onClose(),
    });
  }

  async openFileViewer() {
    if (!get(this.canOpenViewer)) {
      return;
    }

    const viewerType = getFileViewerType(this.manifestWithRequestParams);
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
