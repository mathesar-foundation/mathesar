<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import ImportForm from './ImportForm.svelte';
  import ImportUpload from './ImportUpload.svelte';

  export let controller: ModalController;
  export let tableColumns: ProcessedColumns;

  let file: File | undefined;

  function setFile(newFile: File | undefined): void {
    file = newFile;
  }

  function resetFile() {
    setFile(undefined);
  }
</script>

<ControlledModal
  {controller}
  title={$_('import')}
  on:open={resetFile}
  on:close={resetFile}
>
  {#if file === undefined}
    <ImportUpload {setFile} />
  {:else}
    <ImportForm {file} {tableColumns} {resetFile} />
  {/if}
</ControlledModal>
