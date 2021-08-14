<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { getFileStore, Stages } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';
  import {
    FileUpload,
    Button,
    Icon,
    Notification,
  } from '@mathesar-components';
  import type { Schema } from '@mathesar/App.d';

  import Preview from './preview/Preview.svelte';
  import {
    uploadNewFile,
    getFileUploadInfo,
    shiftStage,
    clearErrors,
  } from './importFileUtils';

  export let id: string = null;
  export let schemaId: Schema['id'] = null;

  let fileImportStore: FileImport;
  $: fileImportStore = getFileStore(schemaId, id);
</script>

<div class="import-file-view">
  <Notification type="danger" show={!!$fileImportStore.error}
                on:close={() => clearErrors(fileImportStore)}>
    There was an error when trying to import file. Please try again.
    <svelte:fragment slot="description">
      {$fileImportStore.error}
    </svelte:fragment>
  </Notification>

  {#if $fileImportStore.stage === Stages.UPLOAD}
    <div>Add Table (Step 1 of 2)</div>
    <h2>Import your data</h2>
    <div class="help-content">
      Create a table by importing data. Very large data sets can sometimes take some minutes to process.
      Please do not close this tab, you may still open and view other tables in the meanwhile.
    </div>

    <FileUpload bind:fileUploads={$fileImportStore.uploads}
                fileProgress={getFileUploadInfo($fileImportStore)}
                on:add={(e) => uploadNewFile(fileImportStore, e.detail)}/>

    <div class="help-content">
      You can import tabular (CSV, TSV) data.
    </div>

  {:else if $fileImportStore.stage === Stages.PREVIEW}
    <Preview {fileImportStore}/>
  {/if}

  <div class="actions">
    <Button appearance="primary"
            disabled={
              $fileImportStore.uploadStatus !== States.Done
              || $fileImportStore.importStatus === States.Loading
              || $fileImportStore.importStatus === States.Error
              || $fileImportStore.previewStatus === States.Loading
              || $fileImportStore.previewStatus === States.Error
              || $fileImportStore.previewTableCreationStatus === States.Loading
              || $fileImportStore.previewTableCreationStatus === States.Error
            }
            on:click={() => shiftStage(fileImportStore)}>
      {$fileImportStore.stage === Stages.PREVIEW ? 'Finish Import' : 'Next'}

      {#if $fileImportStore.importStatus === States.Loading}
        <Icon data={faSpinner} spin={true}/>
      {/if}
    </Button>
  </div>
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
