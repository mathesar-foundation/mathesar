<script lang="ts">
  import { RadioGroup } from '@mathesar-component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import type { SvelteComponent } from 'svelte';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadViaClipboard from './UploadViaClipboard.svelte';

  export let fileImportStore: FileImport;

  type UploadMethod = 'File' | 'URL' | 'Copy and Paste Text';
  interface UploadMethodOption {
    value: UploadMethod,
    component: typeof SvelteComponent,
  }
  const uploadMethods: UploadMethodOption[] = [
    { value: 'File', component: UploadViaFile },
    { value: 'URL', component: UploadViaUrl },
    { value: 'Copy and Paste Text', component: UploadViaClipboard },
  ];
  const radioOptions = uploadMethods.map(({ value }) => ({ value, label: value }));

  let uploadMethodId: UploadMethod = 'File';
  
  $: uploadMethod = uploadMethods.find((m) => m.value === uploadMethodId);
</script>

<h2>Import your data</h2>

<div class="help-content">
  Create a table by importing data. Very large data sets can sometimes take some minutes to process.
  Please do not close this tab, you may still open and view other tables in the meanwhile.
</div>

<RadioGroup
  bind:value={uploadMethodId}
  options={radioOptions}
  isInline
  label="Upload Method"
>
  <h3>Import From</h3>
</RadioGroup>

<svelte:component this={uploadMethod.component} {fileImportStore} />
