import {
  writable,
  Writable,
} from 'svelte/store';

export enum ImportChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
}

export interface FileImportInfo {
  id: string
}

export interface FileImportChange {
  changeType: ImportChangeType,
  info?: FileImportInfo,
  all: FileImportInfo[],
}

export type FileImport = Writable<FileImportInfo>;

let fileId = 0;

export const fileImportChanges = writable<FileImportChange>(null);
const fileImportDetails: FileImportInfo[] = [];
const fileImportMap: Map<string, FileImport> = new Map();

export function newImport(): FileImport {
  const id = `_new_${fileId}`;
  const fileImportInfo: FileImportInfo = { id };

  fileImportDetails.push(fileImportInfo);
  fileImportChanges.set({
    changeType: ImportChangeType.ADDED,
    info: fileImportInfo,
    all: fileImportDetails,
  });

  const fileImport = writable(fileImportInfo);
  fileImportMap.set(id, fileImport);

  fileId += 1;
  return fileImport;
}

export function getImport(id: string): FileImport {
  return fileImportMap.get(id);
}

export function removeImport(id: string): void {
  const index = fileImportDetails.findIndex((importInfo) => importInfo.id === id);
  const removedImport = fileImportDetails.splice(index, 1);

  fileImportChanges.set({
    changeType: ImportChangeType.REMOVED,
    info: removedImport[0],
    all: fileImportDetails,
  });

  fileImportMap.delete(id);
}

export function getAllImportDetails(): FileImportInfo[] {
  return fileImportDetails;
}
