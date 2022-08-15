import { get, writable } from 'svelte/store';
import { States } from '@mathesar/utils/api';

import type { Writable } from 'svelte/store';
import type {
  UploadCompletionOpts,
  PaginatedResponse,
} from '@mathesar/utils/api';
import type { FileUpload } from '@mathesar-component-library/types';
import type { CancellablePromise } from '@mathesar-component-library';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables/tableList';

/**
 * TODO: refactor to remove `id` entirely.
 *
 * Our import system was originally designed with a UI that allowed the user to
 * perform multiple imports asynchronously while using the app for other
 * purposes. We've since changed the design to present the import process to the
 * user as synchronous and uninterruptible. We also changed the import system to
 * live within a dedicated page instead of a tab within the page, meaning we no
 * longer need to handle concurrent imports. I _think_ the purpose of storing
 * `id` values per import was to concurrent imports. I had to do some
 * refactoring but I didn't want to go too deep, so I made one global import id
 * to use everywhere that we were previously passing around unique import id
 * values. The import UI will soon be redesigned and will likely require some
 * refactoring. Until then, I'm leaving this value here as it seems to be the
 * quickest path towards removing the tabs system wherein each import tab was
 * associated with an importId value.
 */
const IMPORT_ID = 'HACKY_ID_VALUE';

export const Stages = {
  UPLOAD: 1,
  PREVIEW: 2,
};

export interface PreviewColumn {
  id: number;
  name: string;
  displayName: string;
  index: number;
  type: string;
  originalType: string;
  isSelected?: boolean;
  isEditable?: boolean;
  primary_key?: boolean;
  valid_target_types: string[] | null;
}

export type PreviewRow = Record<string, string>;

export interface FileImportWritableInfo {
  stage?: number;

  // Upload stage
  uploads?: FileUpload[];
  uploadStatus?: States;
  uploadPromise?: CancellablePromise<unknown>;
  uploadProgress?: UploadCompletionOpts;
  dataFileId?: number;
  isDataFileInfoPresent?: boolean;
  firstRowHeader?: boolean;

  // Preview table create stage
  previewTableCreationStatus?: States;
  previewCreatePromise?: CancellablePromise<unknown>;
  previewDeletePromise?: CancellablePromise<unknown>;

  // Preview stage
  previewStatus?: States;
  previewRowsLoadStatus?: States;
  previewColumnPromise?: CancellablePromise<PaginatedResponse<PreviewColumn>>;
  previewId?: number;
  previewName?: string;
  previewColumns?: PreviewColumn[];
  previewRows?: PreviewRow[];

  // Import stage
  importStatus?: States;
  importPromise?: CancellablePromise<unknown>;
  name?: string;
  error?: string;
}

export interface FileImportInfo extends FileImportWritableInfo {
  id: string;
  schemaId: SchemaEntry['id'];
  databaseName: Database['name'];
}

export interface FileImportStatusWritableInfo {
  name?: FileImportInfo['name'];
  stage?: number;
  dataFileName?: string;
  status?: States;
}

export interface FileImportStatusInfo extends FileImportStatusWritableInfo {
  id: FileImportInfo['id'];
  databaseName: string;
  schemaId: SchemaEntry['id'];
}

export type FileImport = Writable<FileImportInfo>;
export type FileImportStatusMap = Map<
  FileImportStatusInfo['id'],
  FileImportStatusInfo
>;

type FileImportsForSchema = Map<string, FileImport>;

let fileId = 0;

// Storage map
const schemaImportMap: Map<number, FileImportsForSchema> = new Map();

// Import status store - for top indicator
export const importStatuses: Writable<FileImportStatusMap> = writable(
  new Map() as FileImportStatusMap,
);

export function getAllImportDetailsForSchema(
  schemaId: SchemaEntry['id'],
): FileImportInfo[] {
  const imports = schemaImportMap.get(schemaId);
  if (imports) {
    return Array.from(imports.values()).map((entry: FileImport) => get(entry));
  }
  return [];
}

export function getSchemaImportStore(
  schemaId: SchemaEntry['id'],
): FileImportsForSchema {
  let imports = schemaImportMap.get(schemaId);
  if (!imports) {
    imports = new Map();
    schemaImportMap.set(schemaId, imports);
  }
  return imports;
}

export function getFileStore(
  databaseName: Database['name'],
  schemaId: SchemaEntry['id'],
): FileImport {
  const imports = getSchemaImportStore(schemaId);
  const id = IMPORT_ID;

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

export function newImport(
  databaseName: Database['name'],
  schemaId: SchemaEntry['id'],
): FileImport {
  const id = `_new_${fileId}`;
  const fileImport = getFileStore(databaseName, schemaId);
  const fileImportData = get(fileImport);
  importStatuses.update((existingMap) => {
    existingMap.set(id, {
      id,
      schemaId,
      name: fileImportData.name,
      status: States.Idle,
      databaseName,
    });
    return new Map(existingMap);
  });
  fileId += 1;
  return fileImport;
}

export function loadIncompleteImport(
  databaseName: Database['name'],
  schemaId: SchemaEntry['id'],
  tableInfo: TableEntry,
): FileImport {
  const fileImport = getFileStore(databaseName, schemaId);
  if (get(fileImport).stage === Stages.UPLOAD) {
    const dataFileId = tableInfo.data_files?.[0];
    if (dataFileId) {
      setInFileStore(fileImport, {
        uploadStatus: States.Done,
        stage: Stages.PREVIEW,
        previewTableCreationStatus: States.Done,
        previewId: tableInfo.id,
        previewName: tableInfo.name,
        name: tableInfo.name,
        dataFileId,
        firstRowHeader: true,
        isDataFileInfoPresent: false,
      });
    }
  }
  return fileImport;
}

export function deleteImport(schemaId: SchemaEntry['id'], id: string): void {
  const imports = schemaImportMap.get(schemaId);
  const fileImport = imports?.get(id);
  if (fileImport) {
    const fileImportData = get(fileImport);
    fileImportData.importPromise?.cancel();
    fileImportData.uploadPromise?.cancel();
    imports?.delete(id);
  }
  importStatuses.update((existingMap) => {
    existingMap.delete(id);
    return new Map(existingMap);
  });
}

export function removeImportFromView(
  schemaId: SchemaEntry['id'],
  id: string,
): void {
  const imports = schemaImportMap.get(schemaId);
  const fileImport = imports?.get(id);
  if (fileImport) {
    const fileImportData = get(fileImport);
    let isRemovable =
      fileImportData.stage === Stages.UPLOAD &&
      fileImportData.uploadStatus !== States.Done;
    isRemovable =
      isRemovable ||
      (fileImportData.stage === Stages.PREVIEW &&
        fileImportData.importStatus === States.Done);

    if (isRemovable) {
      deleteImport(schemaId, id);
    }
  }
}

export function setImportStatus(
  id: string,
  data: FileImportStatusWritableInfo,
): void {
  const importMap = get(importStatuses);
  if (importMap.get(id)) {
    importStatuses.update((existingMap) => {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      existingMap.set(id, {
        ...existingMap.get(id),
        ...data,
      });
      return new Map(existingMap);
    });
  }
}
