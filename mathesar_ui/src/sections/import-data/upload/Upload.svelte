<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    FileUpload,
    Button,
    Icon,
    RadioGroup,
    TextInput,
  } from '@mathesar-component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import {
    uploadNewFile,
    getFileUploadInfo,
    loadPreview,
    cancelImport,
    importFromURL,
  } from '../importUtils';

  export let fileImportStore: FileImport;

  let importMethod = 'File';
  let fileUrl: string;
  $:buttonControl = ($fileImportStore.uploadStatus !== States.Done
            || $fileImportStore.previewTableCreationStatus === States.Loading)
            && (importMethod !== 'URL' || $fileImportStore.previewTableCreationStatus === States.Loading);

  const options = [
    { id: 'File', label: 'File' },
    { id: 'URL', label: 'URL' },
  ];

  function confirmImport() {
    if (importMethod === 'File') {
      void loadPreview(fileImportStore);
    } else if (importMethod === 'URL') {
      void importFromURL(fileImportStore, fileUrl);
    }
  }
</script>

<div>Add Table (Step 1 of 2)</div>
<h2>Import your data</h2>
<div class="help-content">
  Create a table by importing data. Very large data sets can sometimes take some minutes to process.
  Please do not close this tab, you may still open and view other tables in the meanwhile.
</div>
{#if $fileImportStore.uploadStatus !== States.Done}
  <RadioGroup bind:group={importMethod} {options} isInline={false}>
    <h3>Import From</h3>
  </RadioGroup>
{/if}

{#if importMethod === 'File'}
  <FileUpload bind:fileUploads={$fileImportStore.uploads}
              fileProgress={getFileUploadInfo($fileImportStore)}
              on:add={(e) => uploadNewFile(fileImportStore, e.detail)}/>
  <div class="help-content">
    You can import tabular (CSV, TSV) data.
  </div>   
{/if}

{#if importMethod === 'URL'}
  <div class="help-content">
  Enter a URL pointing to data to download:
  </div>
  <TextInput disabled={$fileImportStore.uploadStatus === States.Loading}
             bind:value={fileUrl}/>
{/if}

<div class="actions">
  <Button on:click={() => cancelImport(fileImportStore)}>
    Cancel
  </Button>

  <Button appearance="primary"
          disabled={buttonControl}
          on:click={() => confirmImport()}>
      Next
    {#if $fileImportStore.previewTableCreationStatus === States.Loading
      || (importMethod === 'URL' && $fileImportStore.uploadStatus === States.Loading)}
      <Icon data={faSpinner} spin={true}/>
    {/if}
  </Button>
</div>
