<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    FileUpload,
    Button,
    Icon,
    Radio,
    TextInput
  } from '@mathesar-components';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import {
    uploadNewFile,
    getFileUploadInfo,
    loadPreview,
    cancelImport,
    uploadURL,
  } from '../importUtils';

  export let fileImportStore: FileImport;

  let group = "File";
  let inputValue:string;
  let options = [
    "File",
    "Copy and Paste Text",
    "URL"
  ];

  async function confirmImport(url) {
    if(group == "File") {
      loadPreview(fileImportStore);
    } else if(group == "URL") {
      const response = await uploadURL(fileImportStore, url);
      loadPreview(fileImportStore);
    }
    //url = ''
  }

</script>

<div>Add Table (Step 1 of 2)</div>
<h2>Import your data</h2>
<div class="help-content">
  Create a table by importing data. Very large data sets can sometimes take some minutes to process.
  Please do not close this tab, you may still open and view other tables in the meanwhile.
</div>
<h3>Import From</h3>
{#if $fileImportStore.uploadStatus !== States.Done}
  {#each options as value}
    <Radio bind:group {value}></Radio>
  {/each}
{/if}

{#if group == 'File'}
  <FileUpload bind:fileUploads={$fileImportStore.uploads}
              fileProgress={getFileUploadInfo($fileImportStore)}
              on:add={(e) => uploadNewFile(fileImportStore, e.detail)}/>
  <div class="help-content">
    You can import tabular (CSV, TSV) data.
  </div>   
{/if}

{#if group == "URL"}
  <div class="help-content">
  Enter a URL pointing to data to download:
  </div>
  <TextInput bind:value={inputValue}></TextInput>
{/if}

<div class="actions">
  <Button on:click={() => cancelImport(fileImportStore)}>
    Cancel
  </Button>

  <Button appearance="primary"
          disabled={
            ($fileImportStore.uploadStatus !== States.Done
            || $fileImportStore.previewTableCreationStatus === States.Loading)
            && group !== 'URL'
          }
          on:click={() => confirmImport(inputValue)}>
      Next

    {#if $fileImportStore.previewTableCreationStatus === States.Loading}
      <Icon data={faSpinner} spin={true}/>
    {/if}
  </Button>
</div>
