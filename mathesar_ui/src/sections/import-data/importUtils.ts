import { get } from 'svelte/store';
import {
  setInFileStore,
  setImportStatus,
  Stages,
  FileImport,
  removeImportFromView,
} from '@mathesar/stores/fileImports';
import { replaceTab } from '@mathesar/stores/tabs';
import { refetchSchema } from '@mathesar/stores/schemas';
import {
  uploadFile,
  States,
  postAPI,
  getAPI,
  patchAPI,
  deleteAPI,
} from '@mathesar/utils/api';
import type { FileImportInfo, PreviewColumn, FileImportWritableInfo } from '@mathesar/stores/fileImports';
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

  setImportStatus(get(fileImportStore).id, {
    status: States.Loading,
    dataFileName: file.name,
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

async function deletePreviewTable(fileImportStore: FileImport): Promise<void> {
  const fileImportData = get(fileImportStore);

  fileImportData.previewDeletePromise?.cancel();

  if (fileImportData.previewId) {
    const previewDeletePromise = deleteAPI(`/tables/${fileImportData.previewId}/`);
    setInFileStore(fileImportStore, {
      previewDeletePromise,
      previewId: null,
    });

    await previewDeletePromise;
  }
}

async function createPreviewTable(
  fileImportStore: FileImport,
): Promise<{ id: number, name: string }> {
  const fileImportData = get(fileImportStore);

  fileImportData.previewCreatePromise?.cancel();

  if (fileImportData.dataFileId) {
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

      const toUpdate: FileImportWritableInfo = {
        previewTableCreationStatus: States.Done,
        previewId: res.id,
        previewName: res.name,
      };
      if (!fileImportData.name?.trim()) {
        toUpdate.name = res.name;
      }

      setInFileStore(fileImportStore, toUpdate);

      return res;
    } catch (err: unknown) {
      setInFileStore(fileImportStore, {
        previewTableCreationStatus: States.Error,
        error: (err as Error).stack,
      });
      throw err;
    }
  } else {
    throw new Error('Unexpected error: Data file not found');
  }
}

export async function fetchPreviewTableInfo(
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

export async function updateDataFileHeader(
  fileImportStore: FileImport,
  headerValue: boolean,
): Promise<void> {
  const fileImportData = get(fileImportStore);
  try {
    setInFileStore(fileImportStore, {
      previewStatus: States.Loading,
      error: null,
    });

    await patchAPI(`/data_files/${fileImportData.dataFileId}/`, {
      header: headerValue,
    });

    await deletePreviewTable(fileImportStore);
    await createPreviewTable(fileImportStore);
    await fetchPreviewTableInfo(fileImportStore);
  } catch (err) {
    setInFileStore(fileImportStore, {
      previewStatus: States.Error,
      error: (err as Error).stack,
    });
  }
}

// When next is clicked after upload
export async function loadPreview(
  fileImportStore: FileImport,
): Promise<{ id: number, name: string }> {
  const fileImportData = get(fileImportStore);
  let tableCreationResult: { id: number, name: string } = null;

  if (fileImportData.previewTableCreationStatus === States.Done) {
    tableCreationResult = {
      id: fileImportData.previewId,
      name: fileImportData.name,
    };
  } else {
    tableCreationResult = await createPreviewTable(fileImportStore);
  }

  setInFileStore(fileImportStore, {
    stage: Stages.PREVIEW,
  });

  return tableCreationResult;
}

// When finish is clicked after preview
export async function finishImport(fileImportStore: FileImport): Promise<void> {
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

    setInFileStore(fileImportStore, {
      importStatus: States.Loading,
      error: null,
    });

    try {
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

      if (fileImportData.name !== fileImportData.previewName) {
        const importPromise = patchAPI(`/tables/${fileImportData.previewId}/`, {
          name: fileImportData.name,
        });
        setInFileStore(fileImportStore, {
          importPromise,
          previewName: fileImportData.name,
        });
        await importPromise;
      }

      void refetchSchema(fileImportData.databaseName, fileImportData.schemaId);

      setInFileStore(fileImportStore, {
        importStatus: States.Done,
      });
      setImportStatus(fileImportData.id, {
        status: States.Done,
      });
      removeImportFromView(fileImportData.schemaId, fileImportData.id);

      replaceTab(fileImportData.databaseName, fileImportData.schemaId, fileImportData.id, {
        id: fileImportData.previewId,
        label: fileImportData.name,
      });
    } catch (err: unknown) {
      setInFileStore(fileImportStore, {
        importStatus: States.Error,
        error: (err as Error).stack,
      });
    }
  }
}

// When errors are manually closed
export function clearErrors(fileImportStore: FileImport): void {
  setInFileStore(fileImportStore, {
    error: null,
  });
}
