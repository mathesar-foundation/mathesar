import { get } from 'svelte/store';
import {
  setInFileStore,
  setImportStatus,
  Stages,
  removeImportFromView,
  deleteImport,
} from '@mathesar/stores/fileImports';
import { getTabsForSchema, constructTabularTab } from '@mathesar/stores/tabs';
import { refetchTablesForSchema } from '@mathesar/stores/tables';
import {
  uploadFile,
  States,
  postAPI,
  getAPI,
  patchAPI,
  deleteAPI,
} from '@mathesar/utils/api';
import { CancellablePromise } from '@mathesar-component-library';
import type {
  FileImportInfo,
  PreviewColumn,
  FileImportWritableInfo,
  FileImport,
} from '@mathesar/stores/fileImports';
import type { UploadCompletionOpts, PaginatedResponse } from '@mathesar/utils/api';
import type {
  FileUploadAddDetail,
  FileUploadProgress,
} from '@mathesar-component-library/types';
import { TabularType } from '@mathesar/App.d';

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
      firstRowHeader: true,
      isDataFileInfoPresent: true,
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
      error: err.message,
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
        error: (err as Error).message,
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
    const suggestedTypesPromise = getAPI<Record<string, string>>(
      `/tables/${fileImportData.previewId}/type_suggestions/`,
    );

    type DataFileResponse = Record<'header', boolean>;
    let dataFilePromise: CancellablePromise<DataFileResponse> = null;
    if (!fileImportData.isDataFileInfoPresent) {
      dataFilePromise = getAPI<DataFileResponse>(`/data_files/${fileImportData.dataFileId}/`);
    }

    setInFileStore(fileImportStore, {
      previewStatus: States.Loading,
      previewColumnPromise,
      error: null,
    });

    const previewColumnResponse = await previewColumnPromise;
    const typesResponse = await suggestedTypesPromise;
    const dataFileReponse = await dataFilePromise;

    const previewColumns = previewColumnResponse.results.map((column) => ({
      ...column,
      displayName: column.name,
      originalType: column.type,
      type: typesResponse[column.name] ?? column.type,
      isEditable: !column.primary_key,
      isSelected: true,
    }));

    const dataToSet: FileImportWritableInfo = {
      previewStatus: States.Done,
      previewColumnPromise,
      previewColumns,
      isDataFileInfoPresent: true,
      error: null,
    };

    if (dataFileReponse !== null) {
      dataToSet.firstRowHeader = dataFileReponse.header;
    }

    setInFileStore(fileImportStore, dataToSet);

    return previewColumns;
  } catch (err) {
    setInFileStore(fileImportStore, {
      previewStatus: States.Error,
      error: (err as Error).message,
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
      error: (err as Error).message,
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
    const columns: {
      name?: PreviewColumn['name'],
      type?: PreviewColumn['type']
    }[] = [];
    fileImportData.previewColumns.forEach((column) => {
      if (column.isSelected) {
        columns.push({
          name: column.displayName,
          type: column.type,
        });
      } else {
        columns.push({});
      }
    });

    fileImportData.importPromise?.cancel();

    try {
      let columnChangePromise: CancellablePromise<unknown> = null;
      let verificationPromise: CancellablePromise<unknown> = null;

      const saveTable = async () => {
        columnChangePromise = patchAPI(`/tables/${fileImportData.previewId}/`, {
          columns,
        });
        await columnChangePromise;
        const verificationRequest: Record<string, unknown> = {
          import_verified: true,
        };
        if (fileImportData.name !== fileImportData.previewName) {
          verificationRequest.name = fileImportData.name;
        }
        verificationPromise = patchAPI(`/tables/${fileImportData.previewId}/`, verificationRequest);
        await verificationPromise;
      };

      const importPromise = new CancellablePromise((resolve, reject) => {
        void saveTable().then(() => resolve(), (err) => reject(err));
      }, () => {
        columnChangePromise?.cancel();
        verificationPromise?.cancel();
      });
      setInFileStore(fileImportStore, {
        importStatus: States.Loading,
        importPromise,
        error: null,
      });
      await importPromise;

      void refetchTablesForSchema(fileImportData.schemaId);

      setInFileStore(fileImportStore, {
        importStatus: States.Done,
      });
      setImportStatus(fileImportData.id, {
        status: States.Done,
      });
      removeImportFromView(fileImportData.schemaId, fileImportData.id);

      const tabList = getTabsForSchema(
        fileImportData.databaseName,
        fileImportData.schemaId,
      );
      const existingTab = tabList.getImportTabByImportID(fileImportData.id);
      if (existingTab) {
        const newTab = constructTabularTab(
          TabularType.Table,
          fileImportData.previewId,
          fileImportData.name,
        );
        tabList.replace(existingTab, newTab);
      }
    } catch (err: unknown) {
      setInFileStore(fileImportStore, {
        importStatus: States.Error,
        error: (err as Error)?.message,
      });
    }
  }
}

export function cancelImport(fileImportStore: FileImport): void {
  const fileImportData = get(fileImportStore);
  if (fileImportData) {
    deleteImport(fileImportData.schemaId, fileImportData.id);
    const tabList = getTabsForSchema(
      fileImportData.databaseName,
      fileImportData.schemaId,
    );
    const existingTab = tabList.getImportTabByImportID(fileImportData.id);
    if (existingTab) {
      tabList.remove(existingTab);
    }
    void deletePreviewTable(fileImportStore);
  }
}

export async function importFromURL(fileImportStore: FileImport, url: string): Promise<void> {
  setInFileStore(fileImportStore, {
    uploadStatus: States.Loading,
    error: null,
  });
  try {
    const uploadResponse = await postAPI<{ id: number }>('/data_files/', { url });
    const { id } = uploadResponse;
    setInFileStore(fileImportStore, {
      dataFileId: id,
      firstRowHeader: true,
      isDataFileInfoPresent: true,
    });
    const res = await loadPreview(fileImportStore);
    setImportStatus(get(fileImportStore).id, {
      status: States.Loading,
      dataFileName: res.name,
    });
  } catch (err: unknown) {
    setInFileStore(fileImportStore, {
      uploadStatus: States.Error,
      error: (err as Error).message,
    });
  }
}

// When errors are manually closed
export function clearErrors(fileImportStore: FileImport): void {
  setInFileStore(fileImportStore, {
    error: null,
  });
}
