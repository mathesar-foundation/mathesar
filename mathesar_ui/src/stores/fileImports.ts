import {
  get,
  writable,
  Writable,
} from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { UploadCompletionOpts } from '@mathesar/utils/api';
import type { FileUpload } from '@mathesar-components/types';
import type { CancellablePromise } from '@mathesar/components';

export enum ImportChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
}

interface FileImportWritableInfo {
  stage?: number,
  uploads?: FileUpload[],
  uploadStatus?: States,
  uploadPromise?: CancellablePromise<unknown>,
  uploadProgress?: UploadCompletionOpts,
  dataFileId?: number,
  importStatus?: States,
  importPromise?: CancellablePromise<unknown>,
  name?: string,
  schema?: string,
  error?: string
}

export interface FileImportInfo extends FileImportWritableInfo {
  id: string
}

export interface FileImportChange {
  changeType: ImportChangeType,
  old?: FileImportInfo,
  info?: FileImportInfo,
  all: FileImportInfo[],
}

export type FileImport = Writable<FileImportInfo>;
let fileId = 0;

// Storage map
interface FileImportsForDB {
  changes: Writable<FileImportChange>,
  imports: Map<string, FileImport>
}
const databaseMap: Map<string, FileImportsForDB> = new Map();

export function getAllImportDetails(db: string): FileImportInfo[] {
  const database = databaseMap.get(db);
  if (database?.imports) {
    return Array.from(database.imports.values()).map((entry: FileImport) => get(entry));
  }
  return [];
}

export function getDBStore(db: string): FileImportsForDB {
  let database = databaseMap.get(db);
  if (!database) {
    database = {
      changes: writable<FileImportChange>(null),
      imports: new Map(),
    };
    databaseMap.set(db, database);
  }
  return database;
}

export function getFileStore(db: string, id: string): FileImport {
  const database = getDBStore(db);

  let fileImport = database.imports.get(id);
  if (!fileImport) {
    const fileImportInitialInfo: FileImportInfo = {
      id,
      name: 'Untitled',
      uploadStatus: States.Idle,
      stage: 1,
    };
    fileImport = writable(fileImportInitialInfo);
    database.imports.set(id, fileImport);
  }
  return fileImport;
}

export function getFileStoreData(db: string, id: string): FileImportInfo {
  return get(getFileStore(db, id));
}

export function setFileStore(db: string, id: string, data: FileImportWritableInfo): void {
  const database = getDBStore(db);
  const store = getFileStore(db, id);
  const existingData = get(store);

  store.set({
    ...existingData,
    ...data,
  });

  database.changes.set({
    changeType: ImportChangeType.MODIFIED,
    old: existingData,
    info: get(store),
    all: getAllImportDetails(db),
  });
}

export function newImport(db: string): void {
  const id = `_new_${fileId}`;
  const database = getDBStore(db);
  const fileImport = getFileStore(db, id);

  database.changes.set({
    changeType: ImportChangeType.ADDED,
    info: get(fileImport),
    all: getAllImportDetails(db),
  });

  fileId += 1;
}

export function removeImport(db:string, id: string): void {
  const database = databaseMap.get(db);
  if (database?.imports) {
    const fileImport = database.imports.get(id);
    const fileImportData = get(fileImport);
    fileImportData.importPromise?.cancel();
    fileImportData.uploadPromise?.cancel();

    database.imports.delete(id);

    database.changes.set({
      changeType: ImportChangeType.REMOVED,
      info: get(fileImport),
      all: getAllImportDetails(db),
    });
  }
}
