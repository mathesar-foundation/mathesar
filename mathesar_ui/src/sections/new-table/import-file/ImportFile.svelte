<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { getFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';
  import { FileUpload, Button, Icon } from '@mathesar-components';
  import {
    Stages,
    uploadNewFile,
    getFileUploadInfo,
    shiftStage,
    cancelStage,
  } from './importFileUtils';

  export let id: string = null;
  export let database: string = null;

  let fileImportData: FileImport;
  $: fileImportData = getFileStore(database, id);
</script>

<div class="import-file-view">
  {#if $fileImportData.error}
    <div class="error">
      <strong>There was an error when trying to import file. Please try again.</strong>
      <code>
        {$fileImportData.error}
      </code>
    </div>
  {/if}

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

  {:else if $fileImportData.stage === Stages.IMPORT}
    <h1>TODO</h1>
    <div>Add Table (Step 2 of 2)</div>
    <h2>Confirm your data</h2>
    <div class="help-content">
      You have 'n' rows of data. To finish, review suggestions for the field types and column names.
      To ensure your import is correct we have included a preview of your first few rows.
    </div>
  {/if}

  <div class="actions">
    <Button on:click={() => cancelStage(database, id)}>Cancel</Button>
    <Button appearance="primary"
            disabled={$fileImportData.uploadStatus !== States.Done || $fileImportData.importStatus === States.Loading}
            on:click={() => shiftStage(database, id)}>
      {$fileImportData.stage === Stages.IMPORT ? 'Finish Import' : 'Next'}

      {#if $fileImportData.importStatus === States.Loading}
        <Icon data={faSpinner} spin={true}/>
      {/if}
    </Button>
  </div>
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
