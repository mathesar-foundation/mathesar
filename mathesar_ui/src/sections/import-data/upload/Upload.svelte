<script lang="ts">
  import { RadioGroup } from '@mathesar-component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import type { SvelteComponent } from 'svelte';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadViaClipboard from './UploadViaClipboard.svelte';

  export let fileImportStore: FileImport;

  type UploadMethodId = 'File' | 'URL' | 'Clipboard';
  interface UploadMethod {
    id: UploadMethodId,
    component: typeof SvelteComponent,
  }
  const uploadMethods: UploadMethod[] = [
    { id: 'File', component: UploadViaFile },
    { id: 'URL', component: UploadViaUrl },
    { id: 'Clipboard', component: UploadViaClipboard },
  ];
  const radioOptions = uploadMethods.map(({ id }) => ({ id, label: id }));

  let uploadMethodId: UploadMethodId = 'File';
  
  $: uploadMethod = uploadMethods.find((m) => m.id === uploadMethodId);
</script>

<h2>Import your data</h2>

<div class="help-content">
  Create a table by importing data. Very large data sets can sometimes take some minutes to process.
  Please do not close this tab, you may still open and view other tables in the meanwhile.
</div>

<RadioGroup bind:group={uploadMethodId} options={radioOptions} isInline={false}>
  <h3>Import From</h3>
</RadioGroup>

<svelte:component this={uploadMethod.component} {fileImportStore} />
