<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { reloadSchemas } from '@mathesar/stores/schemas';
  import { getFileStore, setFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport, FileImportInfo } from '@mathesar/stores/fileImports';
  import { uploadFile, States } from '@mathesar/utils/api';
  import type { UploadCompletionOpts } from '@mathesar/utils/api';
  import { FileUpload, Button } from '@mathesar-components';
  import type { FileUploadAddDetail } from '@mathesar-components/types';

  const dispatch = createEventDispatcher();

  export let id: string = null;
  export let database: string = null;

  let fileImportData: FileImport;
  $: fileImportData = getFileStore(database, id);

  function completionCallback(
    fileId: string,
    completionStatus?: UploadCompletionOpts,
    dataFileId?: number,
  ) {
    if (!completionStatus && typeof dataFileId === 'number') {
      const exisingProgress = $fileImportData.progress as UploadCompletionOpts;
      setFileStore(database, fileId, {
        progress: {
          ...exisingProgress,
          percentCompleted: 100,
        },
        dataFileId,
        uploadStatus: States.Done,
      });
    } else {
      const progress = completionStatus;
      if (completionStatus.percentCompleted > 99) {
        progress.percentCompleted = 99;
      }
      setFileStore(database, fileId, {
        progress,
      });
    }
  }

  function uploadNewFile(e: { detail: FileUploadAddDetail }) {
    const { added } = e.detail;
    const { file } = added[0];
    const importId = id;

    setFileStore(database, importId, {
      progress: null,
      error: null,
      uploadStatus: States.Loading,
    });

    const formData = new FormData();
    formData.append('file', file);

    uploadFile(
      '/data_files/',
      formData,
      (completionStatus: UploadCompletionOpts) => {
        completionCallback(importId, completionStatus);
      },
    ).then((res: { id: number }) => {
      void reloadSchemas();
      completionCallback(importId, null, res.id);
      return res;
    }).catch((err: Error) => {
      setFileStore(database, importId, {
        uploadStatus: States.Error,
        error: err.stack,
      });
    });
  }

  function getFileUploadInfo(fileData: FileImportInfo) {
    if (fileData.uploads?.[0]) {
      return {
        [fileData.uploads[0].fileId]: {
          state: fileData.uploadStatus.toString(),
          progress: fileData.progress?.percentCompleted || 0,
        },
      };
    }
    return {};
  }

  function shiftStage() {
    if ($fileImportData.stage === 2) {
      dispatch('importComplete', id);
    } else {
      setFileStore(database, id, {
        stage: 2,
      });
    }
  }

  function cancelStage() {
    //
  }
</script>

<div class="import-file-view">
  {#if $fileImportData.stage === 1}
    <div>Add Table (Step 1 of 2)</div>
    <h2>Import your data</h2>
    <div class="help-content">
      Create a table by importing data. Very large data sets can sometimes take some minutes to process.
      Please do not close this tab, you may still open and view other tables in the meanwhile.
    </div>

    {#if $fileImportData.uploadStatus === States.Error}
      <div class="error">
        <strong>There was an error when trying to import file. Please try again.</strong>
        <code>
          {$fileImportData.error}
        </code>
      </div>
    {/if}

    <FileUpload bind:fileUploads={$fileImportData.uploads}
                fileProgress={getFileUploadInfo($fileImportData)}
                on:add={uploadNewFile}/>

    <div class="help-content">
      You can import tabular (CSV, TSV) data.
    </div>

  {:else if $fileImportData.stage === 2}
    <h1>TODO</h1>
    <div>Add Table (Step 2 of 2)</div>
    <h2>Confirm your data</h2>
    <div class="help-content">
      You have 'n' rows of data. To finish, review suggestions for the field types and column names.
      To ensure your import is correct we have included a preview of your first few rows.
    </div>

  {/if}

  <div class="actions">
    <Button on:click={cancelStage}>Cancel</Button>
    <Button appearance="primary" disabled={$fileImportData.uploadStatus !== States.Done}
            on:click={shiftStage}>
      {$fileImportData.stage === 2 ? 'Finish Import' : 'Next'}
    </Button>
  </div>
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
