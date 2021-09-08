<script lang="ts">
  import { get } from 'svelte/store';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    TextInput,
    Checkbox,
    Button,
    Icon,
  } from '@mathesar-components';
  import { setInFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import PreviewColumn from './PreviewColumn.svelte';
  import PreviewRows from './PreviewRows.svelte';
  
  import {
    updateDataFileHeader,
    finishImport,
    fetchPreviewTableInfo,
    cancelImport,
  } from '../importUtils';

  export let fileImportStore: FileImport;
  void fetchPreviewTableInfo(fileImportStore);

  function typeChanged(e: CustomEvent) {
    const { previewColumns } = get(fileImportStore);
    const changedColumn = previewColumns.find((column) => column.name === e.detail.name);
    if (changedColumn) {
      changedColumn.type = e.detail.type as string;

      setInFileStore(fileImportStore, {
        previewColumns: [...previewColumns],
      });
    }
  }

  function headerChanged(e: CustomEvent) {
    void updateDataFileHeader(fileImportStore, e.detail.checked as boolean);
  }
</script>

<div>Add Table (Step 2 of 2)</div>
<h2>Confirm your data</h2>

<div class="help-content">
  {#if $fileImportStore.previewStatus === States.Loading}
    Please wait until we prepare a preview

  {:else if $fileImportStore.previewStatus === States.Error}
    {$fileImportStore.error ?? ''}

  {:else}
    To finish, review suggestions for the field types and column names.
    To ensure your import is correct we have included a preview of your first few rows.
  {/if}
</div>

<div class="table-config-options">
  <div class="name">
    Table name: <TextInput bind:value={$fileImportStore.name}/>
  </div>
  
  <Checkbox bind:checked={$fileImportStore.firstRowHeader}
            disabled={$fileImportStore.previewStatus === States.Loading}
            label="Use first row as header"
            on:change={headerChanged}/>
</div>

<div class="preview-table-header">
  Preview

  {#if $fileImportStore.previewStatus === States.Loading
      || $fileImportStore.previewRowsLoadStatus === States.Loading}
    <Icon data={faSpinner} spin={true}/>
  {/if}
</div>

{#if $fileImportStore.previewColumns?.length > 0}
  <div class="preview-table" class:disabled={$fileImportStore.previewStatus === States.Loading}>
    <table>
      <thead>
        <tr>
          {#each $fileImportStore.previewColumns as column (column.name)}
            <PreviewColumn {column} on:typechange={typeChanged}/>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if $fileImportStore.previewColumns}
          {#key $fileImportStore.previewColumns}
            <PreviewRows {fileImportStore} />
          {/key}
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<div class="actions">
  <Button on:click={() => cancelImport(fileImportStore)}>
    Cancel
  </Button>

  <Button appearance="primary"
          disabled={
            $fileImportStore.previewStatus !== States.Done
            || $fileImportStore.importStatus === States.Loading
            || $fileImportStore.previewRowsLoadStatus === States.Loading
            || $fileImportStore.previewRowsLoadStatus === States.Error
          }
          on:click={() => finishImport(fileImportStore)}>
      Finish import

    {#if $fileImportStore.importStatus === States.Loading}
      <Icon data={faSpinner} spin={true}/>
    {/if}
  </Button>
</div>

<style global lang="scss">
  @import "Preview.scss";
</style>
