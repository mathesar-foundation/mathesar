import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { FileAttachmentRequestParams } from '@mathesar/api/rest/fileAttachments';
import { addQueryParamsToUrl } from '@mathesar/api/rest/utils/requestUtils';
import type { FileManifest } from '@mathesar/api/rpc/records';
import { iconDeleteMajor } from '@mathesar/icons';
import { confirm } from '@mathesar/stores/confirmation';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { hasStringProperty } from '@mathesar-component-library';

export interface FileReference {
  uri: string;
  mash: string;
}

export function fetchImage(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

export function getFileViewerType(manifest: FileManifest): 'image' | 'default' {
  const { mimetype } = manifest;
  const mimeCategory = mimetype?.split('/').at(0) ?? 'unknown';
  if (mimeCategory === 'image') {
    return 'image';
  }
  return 'default';
}

export function parseFileReference(value: unknown): FileReference | undefined {
  const obj = (() => {
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(String(value)) as unknown;
    } catch {
      return undefined;
    }
  })();
  if (typeof obj !== 'object') return undefined;
  if (obj === null) return undefined;
  if (!hasStringProperty(obj, 'mash')) return undefined;
  if (!hasStringProperty(obj, 'uri')) return undefined;
  return obj;
}

export async function confirmRemoveFile() {
  return confirm({
    title: get(_)('remove_file_question'),
    body: get(_)('remove_file_confirmation_body'),
    proceedButton: {
      label: get(_)('remove'),
      icon: iconDeleteMajor,
    },
  });
}

export class FileManifestWithRequestParams implements FileManifest {
  uri: string;

  name: string;

  mimetype: string | null;

  thumbnail: string | null;

  attachment: string;

  direct: string;

  showFileStorageInfo: boolean;

  constructor(
    rawManifest: FileManifest,
    requestParams: FileAttachmentRequestParams | undefined,
  ) {
    this.uri = rawManifest.uri;
    this.name = rawManifest.name;
    this.mimetype = rawManifest.mimetype;
    this.thumbnail = rawManifest.thumbnail
      ? addQueryParamsToUrl(rawManifest.thumbnail, requestParams)
      : null;
    this.attachment = addQueryParamsToUrl(
      rawManifest.attachment,
      requestParams,
    );
    this.direct = addQueryParamsToUrl(rawManifest.direct, requestParams);

    const commonData = preloadCommonData();
    this.showFileStorageInfo = commonData.is_authenticated;
  }

  thumbnailWithHeight(thumbnailResolutionHeightPx: number) {
    if (this.thumbnail) {
      return addQueryParamsToUrl(this.thumbnail, {
        height: thumbnailResolutionHeightPx,
      });
    }
    return undefined;
  }
}
