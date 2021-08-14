import {
  get,
  writable,
  Writable,
} from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { UploadCompletionOpts, PaginatedResponse } from '@mathesar/utils/api';
import type { FileUpload } from '@mathesar-components/types';
import type { CancellablePromise } from '@mathesar/components';
import type { Schema } from '@mathesar/App.d';

export const Stages = {
  UPLOAD: 1,
  PREVIEW: 2,
  IMPORT: 3,
};

export interface PreviewColumn {
  name: string,
  displayName: string,
  index: number,
  type: string,
  originalType: string,
  isSelected?: boolean,
  isEditable?: boolean,
  primary_key?: boolean,
  valid_target_types: string[],
}

export type PreviewRow = Record<string, string>;

interface FileImportWritableInfo {
  stage?: number,
  // Upload stage
  uploads?: FileUpload[],
  uploadStatus?: States,
  uploadPromise?: CancellablePromise<unknown>,
  uploadProgress?: UploadCompletionOpts,
  dataFileId?: number,
  firstRowHeader?: boolean,

  // Preview table create stage
  previewTableCreationStatus?: States,
  previewCreatePromise?: CancellablePromise<unknown>,
  previewDeletePromise?: CancellablePromise<unknown>,

  // Preview stage
  previewStatus?: States,
  previewColumnPromise?: CancellablePromise<PaginatedResponse<PreviewColumn>>,
  previewId?: number,
  previewName?: string,
  previewColumns?: PreviewColumn[],
  previewRows?: PreviewRow[],

  // Import stage
  importStatus?: States,
  importPromise?: CancellablePromise<unknown>,
  name?: string,
  error?: string
}

export interface FileImportInfo extends FileImportWritableInfo {
  id: string,
  schemaId: number,
}

export type FileImport = Writable<FileImportInfo>;
let fileId = 0;

// Storage map
type FileImportsForDB = Map<string, FileImport>;
const schemaImportMap: Map<number, FileImportsForDB> = new Map();

export function getAllImportDetails(schemaId: Schema['id']): FileImportInfo[] {
  const imports = schemaImportMap.get(schemaId);
  if (imports) {
    return Array.from(imports.values()).map((entry: FileImport) => get(entry));
  }
  return [];
}

export function getSchemaImportStore(schemaId: Schema['id']): FileImportsForDB {
  let imports = schemaImportMap.get(schemaId);
  if (!imports) {
    imports = new Map();
    schemaImportMap.set(schemaId, imports);
  }
  return imports;
}

export function getFileStore(schemaId: Schema['id'], id: string): FileImport {
  const imports = getSchemaImportStore(schemaId);

  let fileImport = imports.get(id);
  if (!fileImport) {
    const fileImportInitialInfo: FileImportInfo = {
      id,
      schemaId,
      name: 'Untitled',
      uploadStatus: States.Idle,
      stage: Stages.UPLOAD,
      firstRowHeader: true,
    };
    fileImport = writable(fileImportInitialInfo);
    imports.set(id, fileImport);
  }
  return fileImport;
}

export function getFileStoreData(schemaId: Schema['id'], id: string): FileImportInfo {
  return get(getFileStore(schemaId, id));
}

export function setFileStore(schemaId: Schema['id'], id: string, data: FileImportWritableInfo): FileImportInfo {
  const store = getFileStore(schemaId, id);
  store.update((existingData) => ({
    ...existingData,
    ...data,
  }));
  return get(store);
}

export function setInFileStore(
  fileImportStore: FileImport,
  data: FileImportWritableInfo,
): FileImportInfo {
  fileImportStore.update((oldData) => ({
    ...oldData,
    ...data,
  }));
  return get(fileImportStore);
}

export function newImport(schemaId: Schema['id']): FileImport {
  const id = `_new_${fileId}`;
  const fileImport = getFileStore(schemaId, id);
  fileId += 1;
  return fileImport;
}

export function removeImport(schemaId: Schema['id'], id: string): void {
  const imports = schemaImportMap.get(schemaId);
  if (imports) {
    const fileImport = imports.get(id);
    const fileImportData = get(fileImport);
    fileImportData.importPromise?.cancel();
    fileImportData.uploadPromise?.cancel();

    imports.delete(id);
  }
}
