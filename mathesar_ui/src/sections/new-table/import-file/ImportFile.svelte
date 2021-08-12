<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getFileStore, Stages } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';
  import {
    FileUpload,
    Button,
    Icon,
    Notification,
  } from '@mathesar-components';

  import Preview from './preview/Preview.svelte';
  import {
    uploadNewFile,
    getFileUploadInfo,
    shiftStage,
    clearErrors,
  } from './importFileUtils';

  export let id: string = null;
  export let database: string = null;

  let fileImportData: FileImport;
  $: fileImportData = getFileStore(database, id);
</script>

<div class="import-file-view">
  <Notification type="danger" show={!!$fileImportData.error}
                on:close={() => clearErrors(database, id)}>
    There was an error when trying to import file. Please try again.
    <svelte:fragment slot="description">
      {$fileImportData.error}
    </svelte:fragment>
  </Notification>

  {#if $fileImportData.stage === Stages.UPLOAD}
    <div>Add Table (Step 1 of 2)</div>
    <h2>Import your data</h2>
    <div class="help-content">
      Create a table by importing data. Very large data sets can sometimes take some minutes to process.
      Please do not close this tab, you may still open and view other tables in the meanwhile.
    </div>

    <FileUpload bind:fileUploads={$fileImportData.uploads}
                fileProgress={getFileUploadInfo($fileImportData)}
                on:add={(e) => uploadNewFile(database, id, e.detail)}/>

    <div class="help-content">
      You can import tabular (CSV, TSV) data.
    </div>

  {:else if $fileImportData.stage === Stages.PREVIEW}
    <Preview {fileImportData}/>
  {/if}

  <div class="actions">
    <Button appearance="primary"
            disabled={
              $fileImportData.uploadStatus !== States.Done
              || $fileImportData.importStatus === States.Loading
              || $fileImportData.importStatus === States.Error
              || $fileImportData.previewStatus === States.Loading
              || $fileImportData.previewStatus === States.Error
              || $fileImportData.previewTableCreationStatus === States.Loading
              || $fileImportData.previewTableCreationStatus === States.Error
            }
            on:click={() => shiftStage(database, $currentSchema?.id, id)}>
      {$fileImportData.stage === Stages.PREVIEW ? 'Finish Import' : 'Next'}

      {#if $fileImportData.importStatus === States.Loading}
        <Icon data={faSpinner} spin={true}/>
      {/if}
    </Button>
  </div>
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
