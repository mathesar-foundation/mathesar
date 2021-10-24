<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    FileUpload,
    Button,
    Icon,
    RadioGroup,
    TextInput,
  } from '@mathesar-components';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import {
    uploadNewFile,
    getFileUploadInfo,
    loadPreview,
    cancelImport,
    uploadUrl,
  } from '../importUtils';

  export let fileImportStore: FileImport;

  let importMethod = 'File';
  let fileUrl: string;

  const options = [
    'File',
    'URL',
  ];

  async function confirmImport() {
    if (importMethod === 'File') {
      void loadPreview(fileImportStore);
    } else if (importMethod === 'URL') {
      await uploadUrl(fileImportStore, fileUrl);
      fileUrl = '';
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
  <RadioGroup bind:group={importMethod} {options} isInLine={false}>
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
  <TextInput bind:value={fileUrl}></TextInput>
{/if}

<div class="actions">
  <Button on:click={() => cancelImport(fileImportStore)}>
    Cancel
  </Button>

  <Button appearance="primary"
          disabled={
            ($fileImportStore.uploadStatus !== States.Done
            || $fileImportStore.previewTableCreationStatus === States.Loading)
            && importMethod !== 'URL'
          }
          on:click={() => confirmImport()}>
      Next

    {#if $fileImportStore.previewTableCreationStatus === States.Loading}
      <Icon data={faSpinner} spin={true}/>
    {/if}
  </Button>
</div>
