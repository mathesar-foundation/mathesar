import { get } from 'svelte/store';
import {
  setInFileStore,
  setImportStatus,
  Stages,
  removeImportFromView,
  deleteImport,
} from '@mathesar/stores/fileImports';
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
import type {
  UploadCompletionOpts,
  PaginatedResponse,
} from '@mathesar/utils/api';
import type {
  FileUploadAddDetail,
  FileUploadProgress,
} from '@mathesar-component-library/types';
import { TabularType } from '@mathesar/stores/table-data';
import { getErrorMessage } from '@mathesar/utils/errors';

function completionCallback(
  fileImportStore: FileImport,
  completionStatus?: UploadCompletionOpts,
  dataFileId?: number,
): void {
  if (!completionStatus && typeof dataFileId === 'number') {
    const existingProgress = get(fileImportStore).uploadProgress;
    setInFileStore(fileImportStore, {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      uploadProgress: {
        ...existingProgress,
        percentCompleted: 100,
      },
      dataFileId,
      firstRowHeader: true,
      isDataFileInfoPresent: true,
      uploadStatus: States.Done,
    });
  } else {
    const uploadProgress = completionStatus;
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    if (completionStatus.percentCompleted > 99) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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
    '/api/db/v0/data_files/',
    formData,
    (completionStatus: UploadCompletionOpts) => {
      completionCallback(fileImportStore, completionStatus);
    },
  );

  setInFileStore(fileImportStore, {
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    uploadProgress: null,
    uploadStatus: States.Loading,
    uploadPromise,
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    error: null,
  });

  setImportStatus(get(fileImportStore).id, {
    status: States.Loading,
    dataFileName: file.name,
  });

  uploadPromise
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    .then((res: { id: number }) => {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      completionCallback(fileImportStore, null, res.id);
      return res;
    })
    .catch((err: Error) => {
      setInFileStore(fileImportStore, {
        uploads: [],
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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
    const previewDeletePromise = deleteAPI(
      `/api/db/v0/tables/${fileImportData.previewId}/`,
    );
    setInFileStore(fileImportStore, {
      previewDeletePromise,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      previewId: null,
    });

    await previewDeletePromise;
  }
}

async function createPreviewTable(
  fileImportStore: FileImport,
): Promise<{ id: number; name: string }> {
  const fileImportData = get(fileImportStore);

  fileImportData.previewCreatePromise?.cancel();

  if (fileImportData.dataFileId === undefined) {
    throw new Error('Unexpected error: Data file not found');
  }

  const previewCreatePromise = postAPI('/api/db/v0/tables/', {
    name: fileImportData.previewName,
    schema: fileImportData.schemaId,
    data_files: [fileImportData.dataFileId],
  });

  setInFileStore(fileImportStore, {
    previewTableCreationStatus: States.Loading,
    previewCreatePromise,
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    error: null,
  });

  try {
    const res = (await previewCreatePromise) as { id: number; name: string };

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
}

export async function fetchPreviewTableInfo(
  fileImportStore: FileImport,
): Promise<unknown> {
  const fileImportData = get(fileImportStore);
  fileImportData.previewColumnPromise?.cancel();

  try {
    const previewColumnPromise = getAPI<PaginatedResponse<PreviewColumn>>(
      // https://github.com/centerofci/mathesar/issues/1055
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `/api/db/v0/tables/${fileImportData.previewId}/columns/?limit=500`,
    );
    const suggestedTypesPromise = getAPI<Record<string, string>>(
      // https://github.com/centerofci/mathesar/issues/1055
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `/api/db/v0/tables/${fileImportData.previewId}/type_suggestions/`,
    );

    type DataFileResponse = Record<'header', boolean>;
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    let dataFilePromise: CancellablePromise<DataFileResponse> = null;
    if (!fileImportData.isDataFileInfoPresent) {
      dataFilePromise = getAPI<DataFileResponse>(
        // https://github.com/centerofci/mathesar/issues/1055
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `/api/db/v0/data_files/${fileImportData.dataFileId}/`,
      );
    }

    setInFileStore(fileImportStore, {
      previewStatus: States.Loading,
      previewColumnPromise,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      error: null,
    });

    const previewColumnResponse = await previewColumnPromise;
    const typesResponse = await suggestedTypesPromise;
    const dataFileResponse = await dataFilePromise;

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
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      error: null,
    };

    if (dataFileResponse !== null) {
      dataToSet.firstRowHeader = dataFileResponse.header;
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
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      error: null,
    });

    // https://github.com/centerofci/mathesar/issues/1055
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await patchAPI(`/api/db/v0/data_files/${fileImportData.dataFileId}/`, {
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
): Promise<{ id: number; name: string }> {
  const fileImportData = get(fileImportStore);
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  let tableCreationResult: { id: number; name: string } = null;

  if (fileImportData.previewTableCreationStatus === States.Done) {
    tableCreationResult = {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      id: fileImportData.previewId,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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

/**
 * When finish is clicked after preview.
 *
 * @returns the id of the table created if successful, `undefined` otherwise.
 */
export async function finishImport(
  fileImportStore: FileImport,
): Promise<number | undefined> {
  const fileImportData = get(fileImportStore);
  const { previewId } = fileImportData;
  if (previewId === undefined) {
    return undefined;
  }

  const previewColumns = fileImportData.previewColumns ?? [];
  const columns = previewColumns.map((column) => ({
    id: column.id,
    name: column.displayName,
    type: column.type,
  }));

  fileImportData.importPromise?.cancel();

  try {
    let columnChangePromise: CancellablePromise<unknown> | undefined;
    let verificationPromise: CancellablePromise<unknown> | undefined;

    const saveTable = async () => {
      const url = `/api/db/v0/tables/${previewId}/`;
      columnChangePromise = patchAPI(url, { columns });
      await columnChangePromise;
      const verificationRequest: Record<string, unknown> = {
        import_verified: true,
      };
      if (fileImportData.name !== fileImportData.previewName) {
        verificationRequest.name = fileImportData.name;
      }
      verificationPromise = patchAPI(url, verificationRequest);
      await verificationPromise;
    };

    const importPromise = new CancellablePromise(
      (resolve, reject) => {
        void saveTable().then(
          () => resolve(),
          (err) => reject(err),
        );
      },
      () => {
        columnChangePromise?.cancel();
        verificationPromise?.cancel();
      },
    );
    setInFileStore(fileImportStore, {
      importStatus: States.Loading,
      importPromise,
      error: undefined,
    });
    await importPromise;

    await refetchTablesForSchema(fileImportData.schemaId);

    setInFileStore(fileImportStore, {
      importStatus: States.Done,
    });
    setImportStatus(fileImportData.id, {
      status: States.Done,
    });
    removeImportFromView(fileImportData.schemaId, fileImportData.id);

    return previewId;
  } catch (err: unknown) {
    setInFileStore(fileImportStore, {
      importStatus: States.Error,
      error: getErrorMessage(err),
    });
    return undefined;
  }
}

export function cancelImport(fileImportStore: FileImport): void {
  const fileImportData = get(fileImportStore);
  if (fileImportData) {
    deleteImport(fileImportData.schemaId, fileImportData.id);
    void deletePreviewTable(fileImportStore);
  }
}

interface DataFilesRequestData {
  url?: string;
  paste?: string;
}

async function importData(
  fileImportStore: FileImport,
  data: DataFilesRequestData,
): Promise<void> {
  setInFileStore(fileImportStore, {
    uploadStatus: States.Loading,
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    error: null,
  });
  try {
    const uploadResponse = await postAPI<{ id: number }>(
      '/api/db/v0/data_files/',
      data,
    );
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
    setInFileStore(fileImportStore, {
      uploadStatus: States.Done,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      error: null,
    });
  } catch (err: unknown) {
    setInFileStore(fileImportStore, {
      uploadStatus: States.Error,
      error: (err as Error).message,
    });
  }
}

export async function importFromURL(
  fileImportStore: FileImport,
  url: string,
): Promise<void> {
  return importData(fileImportStore, { url });
}

export async function importFromText(
  fileImportStore: FileImport,
  text: string,
): Promise<void> {
  return importData(fileImportStore, { paste: text });
}

// When errors are manually closed
export function clearErrors(fileImportStore: FileImport): void {
  setInFileStore(fileImportStore, {
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    error: null,
  });
}
