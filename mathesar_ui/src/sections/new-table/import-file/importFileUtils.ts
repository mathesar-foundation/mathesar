import { getFileStoreData, setFileStore, Stages } from '@mathesar/stores/fileImports';
import { replaceTab } from '@mathesar/stores/tabs';
import {
  uploadFile,
  States,
  postAPI,
  getAPI,
} from '@mathesar/utils/api';
import type { FileImportInfo, PreviewColumn } from '@mathesar/stores/fileImports';
import type { UploadCompletionOpts, PaginatedResponse } from '@mathesar/utils/api';
import type {
  FileUploadAddDetail,
  FileUploadProgress,
} from '@mathesar-components/types';

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

function createTable(database: string, schemaId: number, importId: string) {
  const fileImportData = getFileStoreData(database, importId);

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

async function createPreviewTable(
  database: string,
  schemaId: number,
  importId: string,
): Promise<{ id: number, name: string }> {
  const fileImportData = getFileStoreData(database, importId);

  fileImportData.previewCreatePromise?.cancel();

  if (fileImportData.previewTableCreationStatus === States.Done) {
    return {
      id: fileImportData.previewId,
      name: fileImportData.previewName,
    };
  }

  if (
    fileImportData.uploadStatus === States.Done
    && typeof schemaId === 'number'
    && fileImportData.dataFileId
  ) {
    const previewCreatePromise = postAPI('/tables/', {
      schema: schemaId,
      data_files: [fileImportData.dataFileId],
    });

    setFileStore(database, importId, {
      previewTableCreationStatus: States.Loading,
      previewCreatePromise,
      firstRowHeader: true,
      error: null,
    });

    try {
      const res = await previewCreatePromise as { id: number, name: string };

      setFileStore(database, importId, {
        previewTableCreationStatus: States.Done,
        previewId: res.id,
        previewName: res.name,
      });

      return res;
    } catch (err: unknown) {
      setFileStore(database, importId, {
        previewTableCreationStatus: States.Error,
        error: (err as Error).stack,
      });
    }
  }
  return null;
}

async function fetchPreviewTableInfo(
  database: string,
  importId: string,
  tableId: number,
): Promise<unknown> {
  const fileImportData = getFileStoreData(database, importId);
  fileImportData.previewColumnPromise?.cancel();

  try {
    const previewColumnPromise = getAPI<PaginatedResponse<PreviewColumn>>(
      `/tables/${tableId}/columns/?limit=500`,
    );

    setFileStore(database, importId, {
      previewStatus: States.Loading,
      previewColumnPromise,
      error: null,
    });

    const previewColumnResponse = await previewColumnPromise;

    const previewColumns = previewColumnResponse.results.map((column) => ({
      ...column,
      displayName: column.name,
      isEditable: !column.primary_key,
      isSelected: true,
    }));

    setFileStore(database, importId, {
      previewStatus: States.Done,
      previewColumnPromise,
      previewColumns,
      error: null,
    });

    return previewColumns;
  } catch (err) {
    setFileStore(database, importId, {
      previewStatus: States.Error,
      error: (err as Error).stack,
    });
  }
  return null;
}

async function loadPreviewTable(
  database: string,
  schemaId: number,
  importId: string,
): Promise<unknown> {
  const tableCreationResult = await createPreviewTable(database, schemaId, importId);
  if (tableCreationResult) {
    const columnInfo = await fetchPreviewTableInfo(database, importId, tableCreationResult.id);
    return columnInfo;
  }
  return null;
}

export function shiftStage(database: string, schemaId: number, importId: string): void {
  const fileImportData = getFileStoreData(database, importId);
  switch (fileImportData.stage) {
    case Stages.UPLOAD: {
      setFileStore(database, importId, {
        stage: Stages.PREVIEW,
      });
      void loadPreviewTable(database, schemaId, importId);
      break;
    }
    case Stages.PREVIEW: {
      createTable(database, schemaId, importId);
      break;
    }
    default:
      break;
  }
}

export function cancelStage(database: string, importId: string): void {
  const fileImportData = getFileStoreData(database, importId);

  switch (fileImportData.stage) {
    case Stages.UPLOAD:
      fileImportData.uploadPromise?.cancel();
      break;
    case Stages.PREVIEW:
      fileImportData.previewCreatePromise?.cancel();
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
