<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Table } from '@mathesar/models/Table';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import ImportForm from './ImportForm.svelte';
  import ImportUpload from './ImportUpload.svelte';

  export let controller: ModalController;
  export let table: Table;
  export let tableColumns: ProcessedColumns;
  export let onFinish: () => void;

  let file: File | undefined;

  function setFile(newFile: File | undefined): void {
    file = newFile;
  }

  function resetFile() {
    setFile(undefined);
  }

  function handleFinish() {
    controller.close();
    onFinish();
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
    <ImportForm
      {table}
      {file}
      {tableColumns}
      {resetFile}
      onFinish={handleFinish}
    />
  {/if}
</ControlledModal>
