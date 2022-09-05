<script lang="ts">
  import { RadioGroup } from '@mathesar-component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadViaClipboard from './UploadViaClipboard.svelte';

  export let fileImportStore: FileImport;

  const uploadMethods = [
    { label: 'File', component: UploadViaFile },
    { label: 'URL', component: UploadViaUrl },
    { label: 'Copy and Paste Text', component: UploadViaClipboard },
  ];
  let uploadMethod = uploadMethods[0];
</script>

<h2>Import your data</h2>

<div class="help-content">
  Create a table by importing data. Very large data sets can sometimes take some
  minutes to process. Please do not close this tab, you may still open and view
  other tables in the meanwhile.
</div>

<RadioGroup
  bind:value={uploadMethod}
  options={uploadMethods}
  isInline
  label="Upload Method"
>
  <h3>Import From</h3>
</RadioGroup>

<div class="import-section">
  <svelte:component this={uploadMethod.component} {fileImportStore} />
</div>

<style lang="scss">
  .import-section {
    margin: 0.9rem 0;

    :global(.help-content) {
      margin: 0.4rem 0;
    }

    :global(.buttons) {
      margin-top: 0.9rem;
      text-align: right;
    }
  }
</style>
