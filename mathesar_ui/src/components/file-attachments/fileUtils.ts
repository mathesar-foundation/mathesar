import type { FileManifest } from '@mathesar/api/rpc/records';

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
  const mimeCategory = mimetype.split('/').at(0) ?? 'unknown';
  if (mimeCategory === 'image') {
    return 'image';
  }
  return 'default';
}
