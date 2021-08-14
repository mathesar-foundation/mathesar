<script lang="ts">
  import { get } from 'svelte/store';
  import { Checkbox } from '@mathesar-components';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import PreviewColumn from './PreviewColumn.svelte';
  import PreviewRows from './PreviewRows.svelte';
  
  import {
    updateDataFileHeader,
  } from '../importFileUtils';

  export let fileImportStore: FileImport;

  function typeChanged(e: CustomEvent) {
    const { previewColumns } = get(fileImportStore);
    const changedColumn = previewColumns.find((column) => column.name === e.detail.name);
    if (changedColumn) {
      changedColumn.type = e.detail.type as string;

      fileImportStore.update((data) => ({
        ...data,
        previewColumns: [...previewColumns],
      }));
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

<Checkbox bind:checked={$fileImportStore.firstRowHeader}
          label="Use first row as header"
          on:change={headerChanged}/>

{#if $fileImportStore.previewColumns?.length > 0}
  <div class="preview-table">
    <table>
      <thead>
        <tr>
          {#each $fileImportStore.previewColumns as column (column.name)}
            <PreviewColumn {column} on:typechange={typeChanged}/>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#key $fileImportStore.previewColumns}
          <PreviewRows tableId={$fileImportStore.previewId}
            columns={$fileImportStore.previewColumns}
            bind:rows={$fileImportStore.previewRows}/>
        {/key}
      </tbody>
    </table>
  </div>
{/if}

<style global lang="scss">
  @import "Preview.scss";
</style>
