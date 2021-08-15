import {
  get,
  writable,
  Writable,
} from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { UploadCompletionOpts, PaginatedResponse } from '@mathesar/utils/api';
import type { FileUpload } from '@mathesar-components/types';
import type { CancellablePromise } from '@mathesar/components';
import type { Database, Schema } from '@mathesar/App.d';

export const Stages = {
  UPLOAD: 1,
  PREVIEW: 2,
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

export interface FileImportWritableInfo {
  stage?: number,

  // Upload stage
  uploads?: FileUpload[],
  uploadStatus?: States,
  uploadPromise?: CancellablePromise<unknown>,
  uploadProgress?: UploadCompletionOpts,
  dataFileId?: number,
  dataFileName?: string,
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
  schemaId: Schema['id'],
  databaseName: Database['name']
}

export interface FileImportStatusInfo {
  id: FileImportInfo['id'],
  databaseName: string,
  schemaId: Schema['id'],
  name: FileImportInfo['name'],
  status: States
}

export type FileImport = Writable<FileImportInfo>;

type FileImportsForSchema = Map<string, FileImport>;
type FileImportStatusMap = Map<FileImportStatusInfo['id'], FileImportStatusInfo>;

let fileId = 0;

// Storage map
const schemaImportMap: Map<number, FileImportsForSchema> = new Map();

// Import status store - for top indicator
export const importStatuses: Writable<FileImportStatusMap> = writable(
  new Map() as FileImportStatusMap,
);

export function getAllImportDetailsForSchema(schemaId: Schema['id']): FileImportInfo[] {
  const imports = schemaImportMap.get(schemaId);
  if (imports) {
    return Array.from(imports.values()).map((entry: FileImport) => get(entry));
  }
  return [];
}

export function getSchemaImportStore(schemaId: Schema['id']): FileImportsForSchema {
  let imports = schemaImportMap.get(schemaId);
  if (!imports) {
    imports = new Map();
    schemaImportMap.set(schemaId, imports);
  }
  return imports;
}

export function getFileStore(databaseName: Database['name'], schemaId: Schema['id'], id: string): FileImport {
  const imports = getSchemaImportStore(schemaId);

  let fileImport = imports.get(id);
  if (!fileImport) {
    const fileImportInitialInfo: FileImportInfo = {
      id,
      schemaId,
      databaseName,
      uploadStatus: States.Idle,
      stage: Stages.UPLOAD,
      firstRowHeader: true,
    };
    fileImport = writable(fileImportInitialInfo);
    imports.set(id, fileImport);
  }
  return fileImport;
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

export function newImport(databaseName: Database['name'], schemaId: Schema['id']): FileImport {
  const id = `_new_${fileId}`;
  const fileImport = getFileStore(databaseName, schemaId, id);
  const fileImportData = get(fileImport);
  importStatuses.update((existingMap) => {
    existingMap.set(id, {
      id,
      schemaId,
      name: fileImportData.name,
      status: States.Loading,
      databaseName,
    });
    return existingMap;
  });
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
