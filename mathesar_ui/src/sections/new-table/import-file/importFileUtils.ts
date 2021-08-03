import { selectedSchema } from '@mathesar/stores/schemas';
import { getFileStoreData, setFileStore } from '@mathesar/stores/fileImports';
import { replaceTab } from '@mathesar/stores/tabs';
import { uploadFile, States, postAPI } from '@mathesar/utils/api';
import type { FileImportInfo } from '@mathesar/stores/fileImports';
import type { UploadCompletionOpts } from '@mathesar/utils/api';
import type {
  FileUploadAddDetail,
  FileUploadProgress,
} from '@mathesar-components/types';
import { get } from 'svelte/store';

export const Stages = {
  UPLOAD: 1,
  IMPORT: 2,
};

function completionCallback(
  database: string,
  importId: string,
  completionStatus?: UploadCompletionOpts,
  dataFileId?: number,
): void {
  if (!completionStatus && typeof dataFileId === 'number') {
    const exisingProgress = getFileStoreData(database, importId).uploadProgress;
    setFileStore(database, importId, {
      uploadProgress: {
        ...exisingProgress,
        percentCompleted: 100,
      },
      dataFileId,
      uploadStatus: States.Done,
    });
  } else {
    const uploadProgress = completionStatus;
    if (completionStatus.percentCompleted > 99) {
      uploadProgress.percentCompleted = 99;
    }
    setFileStore(database, importId, {
      uploadProgress,
    });
  }
}

export function uploadNewFile(
  database: string,
  importId: string,
  detail: FileUploadAddDetail,
): void {
  const { added } = detail;
  const { file } = added[0];

  const formData = new FormData();
  formData.append('file', file);
  const uploadPromise = uploadFile(
    '/data_files/',
    formData,
    (completionStatus: UploadCompletionOpts) => {
      completionCallback(database, importId, completionStatus);
    },
  );

  setFileStore(database, importId, {
    uploadProgress: null,
    uploadStatus: States.Loading,
    uploadPromise,
    error: null,
  });

  uploadPromise.then((res: { id: number }) => {
    completionCallback(database, importId, null, res.id);
    return res;
  }).catch((err: Error) => {
    setFileStore(database, importId, {
      uploads: [],
      uploadProgress: null,
      uploadStatus: States.Error,
      error: err.stack,
    });
  });
}

export function getFileUploadInfo(
  fileData: FileImportInfo,
): Record<string, FileUploadProgress> {
  if (fileData.uploads?.[0]) {
    return {
      [fileData.uploads[0].fileId]: {
        state: fileData.uploadStatus.toString(),
        progress: fileData.uploadProgress?.percentCompleted || 0,
      },
    };
  }
  return {};
}

function createTable(database: string, importId: string) {
  const fileImportData = getFileStoreData(database, importId);
  const schemaId = get(selectedSchema)?.id;

  if (
    fileImportData.uploadStatus === States.Done
    && typeof schemaId === 'number'
    && fileImportData.dataFileId
  ) {
    const importPromise = postAPI('/tables/', {
      name: fileImportData.name,
      schema: schemaId,
      data_files: [fileImportData.dataFileId],
    });

    setFileStore(database, importId, {
      importStatus: States.Loading,
      importPromise,
      error: null,
    });

    importPromise.then((res: { id: number, name: string }) => {
      setFileStore(database, importId, {
        importStatus: States.Done,
      });
      replaceTab(database, importId, {
        id: res.id,
        label: res.name,
      });
      return res;
    }).catch((err: Error) => {
      setFileStore(database, importId, {
        importStatus: States.Error,
        error: err.stack,
      });
    });
  }
}

export function shiftStage(database: string, importId: string): void {
  const fileImportData = getFileStoreData(database, importId);
  if (fileImportData.stage === Stages.IMPORT) {
    createTable(database, importId);
  } else {
    setFileStore(database, importId, {
      stage: 2,
    });
  }
}

export function cancelStage(database: string, importId: string): void {
  const fileImportData = getFileStoreData(database, importId);

  switch (fileImportData.stage) {
    case Stages.UPLOAD:
      fileImportData.uploadPromise?.cancel();
      break;
    case Stages.IMPORT:
      fileImportData.importPromise?.cancel();
      break;
    default:
      break;
  }
}

export function clearErrors(database: string, importId: string): void {
  setFileStore(database, importId, {
    error: null,
  });
}
