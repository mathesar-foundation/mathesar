import { get } from 'svelte/store';
import {
  setInFileStore,
  Stages,
  FileImport,
} from '@mathesar/stores/fileImports';
import { replaceTab } from '@mathesar/stores/tabs';
import {
  uploadFile,
  States,
  postAPI,
  getAPI,
  patchAPI,
  deleteAPI,
} from '@mathesar/utils/api';
import type { FileImportInfo, PreviewColumn } from '@mathesar/stores/fileImports';
import type { UploadCompletionOpts, PaginatedResponse } from '@mathesar/utils/api';
import type {
  FileUploadAddDetail,
  FileUploadProgress,
} from '@mathesar-components/types';

function completionCallback(
  fileImportStore: FileImport,
  completionStatus?: UploadCompletionOpts,
  dataFileId?: number,
): void {
  if (!completionStatus && typeof dataFileId === 'number') {
    const exisingProgress = get(fileImportStore).uploadProgress;
    setInFileStore(fileImportStore, {
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
    setInFileStore(fileImportStore, {
      uploadProgress,
    });
  }
}

export function uploadNewFile(
  fileImportStore: FileImport,
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
      completionCallback(fileImportStore, completionStatus);
    },
  );

  setInFileStore(fileImportStore, {
    uploadProgress: null,
    uploadStatus: States.Loading,
    uploadPromise,
    error: null,
  });

  uploadPromise.then((res: { id: number }) => {
    completionCallback(fileImportStore, null, res.id);
    return res;
  }).catch((err: Error) => {
    setInFileStore(fileImportStore, {
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

async function finishImport(fileImportStore: FileImport): Promise<void> {
  const fileImportData = get(fileImportStore);

  if (fileImportData.previewId) {
    const deletedColumns: PreviewColumn[] = [];
    const columns: PreviewColumn[] = [];
    fileImportData.previewColumns.forEach((column) => {
      if (column.isSelected) {
        if (column.type !== column.originalType
            || column.name !== column.displayName) {
          columns.push(column);
        }
      } else {
        deletedColumns.push(column);
      }
    });

    const deletePromises = deletedColumns.map((column) => deleteAPI(
      `/tables/${fileImportData.previewId}/columns/${column.index}/`,
    ));

    await Promise.all(deletePromises);

    const updatePromises = columns.map((column) => patchAPI(
      `/tables/${fileImportData.previewId}/columns/${column.index}/`,
      {
        name: column.displayName,
        type: column.type,
      },
    ));

    await Promise.all(updatePromises);

    const importPromise = patchAPI(`/tables/${fileImportData.previewId}/`, {
      name: fileImportData.name,
      id: fileImportData.previewId,
    });
    setInFileStore(fileImportStore, {
      importStatus: States.Loading,
      importPromise,
      error: null,
    });

    try {
      await importPromise;
      setInFileStore(fileImportStore, {
        importStatus: States.Done,
      });
      // TODO: Replace tab on success!
      // replaceTab(fileImportData.database, fileImportData.id, {
      //   id: fileImportData.previewId,
      //   label: fileImportData.name,
      // });
    } catch (err: unknown) {
      setInFileStore(fileImportStore, {
        importStatus: States.Error,
        error: (err as Error).stack,
      });
    }
  }
}

async function deletePreviewTable(fileImportStore: FileImport): Promise<void> {
  const fileImportData = get(fileImportStore);

  fileImportData.previewDeletePromise?.cancel();

  if (fileImportData.previewId) {
    const previewDeletePromise = deleteAPI(`/tables/${fileImportData.previewId}/`);
    setInFileStore(fileImportStore, {
      previewDeletePromise,
      previewId: null,
    });

    try {
      await previewDeletePromise;
    } catch (err: unknown) {
      // Handle error!
    }
  }
}

async function createPreviewTable(
  fileImportStore: FileImport,
): Promise<{ id: number, name: string }> {
  const fileImportData = get(fileImportStore);

  fileImportData.previewCreatePromise?.cancel();

  if (
    fileImportData.uploadStatus === States.Done
    && typeof fileImportData.schemaId === 'number'
    && fileImportData.dataFileId
  ) {
    const previewCreatePromise = postAPI('/tables/', {
      name: fileImportData.previewName,
      schema: fileImportData.schemaId,
      data_files: [fileImportData.dataFileId],
    });

    setInFileStore(fileImportStore, {
      previewTableCreationStatus: States.Loading,
      previewCreatePromise,
      error: null,
    });

    try {
      const res = await previewCreatePromise as { id: number, name: string };

      setInFileStore(fileImportStore, {
        previewTableCreationStatus: States.Done,
        previewId: res.id,
        previewName: res.name,
      });

      return res;
    } catch (err: unknown) {
      setInFileStore(fileImportStore, {
        previewTableCreationStatus: States.Error,
        error: (err as Error).stack,
      });
    }
  }
  return null;
}

async function fetchPreviewTableInfo(
  fileImportStore: FileImport,
): Promise<unknown> {
  const fileImportData = get(fileImportStore);
  fileImportData.previewColumnPromise?.cancel();

  try {
    const previewColumnPromise = getAPI<PaginatedResponse<PreviewColumn>>(
      `/tables/${fileImportData.previewId}/columns/?limit=500`,
    );

    setInFileStore(fileImportStore, {
      previewStatus: States.Loading,
      previewColumnPromise,
      error: null,
    });

    const previewColumnResponse = await previewColumnPromise;

    const previewColumns = previewColumnResponse.results.map((column) => ({
      ...column,
      displayName: column.name,
      originalType: column.type,
      isEditable: !column.primary_key,
      isSelected: true,
    }));

    setInFileStore(fileImportStore, {
      previewStatus: States.Done,
      previewColumnPromise,
      previewColumns,
      error: null,
    });

    return previewColumns;
  } catch (err) {
    setInFileStore(fileImportStore, {
      previewStatus: States.Error,
      error: (err as Error).stack,
    });
  }
  return null;
}

async function loadPreviewTable(
  fileImportStore: FileImport,
): Promise<unknown> {
  const fileImportData = get(fileImportStore);
  let tableCreationResult;

  if (fileImportData.previewTableCreationStatus === States.Done) {
    tableCreationResult = {
      id: fileImportData.previewId,
      name: fileImportData.previewName,
    };
  } else {
    tableCreationResult = await createPreviewTable(fileImportStore);
  }

  if (tableCreationResult) {
    const columnInfo = await fetchPreviewTableInfo(fileImportStore);
    return columnInfo;
  }
  return null;
}

export function shiftStage(fileImportStore: FileImport): void {
  const fileImportData = get(fileImportStore);

  switch (fileImportData.stage) {
    case Stages.UPLOAD: {
      setInFileStore(fileImportStore, {
        stage: Stages.PREVIEW,
      });
      void loadPreviewTable(fileImportStore);
      break;
    }
    case Stages.PREVIEW: {
      void finishImport(fileImportStore);
      break;
    }
    default:
      break;
  }
}

export async function updateDataFileHeader(
  fileImportStore: FileImport,
  headerValue: boolean,
): Promise<void> {
  // Update header file
  // Delete and recreate old table
  // (It would be better if we had an option to drop and re-create with same table id)

  const fileImportData = get(fileImportStore);
  try {
    await patchAPI(`/data_files/${fileImportData.dataFileId}/`, {
      header: headerValue,
    });

    await deletePreviewTable(fileImportStore);
    await createPreviewTable(fileImportStore);
    await fetchPreviewTableInfo(fileImportStore);
  } catch (err) {
    //
  }
}

export function clearErrors(fileImportStore: FileImport): void {
  setInFileStore(fileImportStore, {
    error: null,
  });
}
