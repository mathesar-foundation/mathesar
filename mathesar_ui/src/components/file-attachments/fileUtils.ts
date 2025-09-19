import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { FileManifest } from '@mathesar/api/rpc/records';
import { iconDeleteMajor } from '@mathesar/icons';
import { confirm } from '@mathesar/stores/confirmation';
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
