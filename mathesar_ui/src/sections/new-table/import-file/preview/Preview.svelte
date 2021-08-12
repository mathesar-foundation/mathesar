<script lang="ts">
  import { get } from 'svelte/store';
  import { Checkbox } from '@mathesar-components';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';

  import PreviewColumn from './PreviewColumn.svelte';
  import PreviewRows from './PreviewRows.svelte';

  export let fileImportData: FileImport;

  function typeChanged(e: CustomEvent) {
    const { previewColumns } = get(fileImportData);
    const changedColumn = previewColumns.find((column) => column.name === e.detail.name);
    if (changedColumn) {
      changedColumn.type = e.detail.type as string;

      fileImportData.update((data) => ({
        ...data,
        previewColumns: [...previewColumns],
      }));
    }
  }
</script>

<div>Add Table (Step 2 of 2)</div>
<h2>Confirm your data</h2>

<Checkbox bind:checked={$fileImportData.firstRowHeader} label="Use first row as header"/>

<div class="help-content">
  {#if $fileImportData.previewStatus === States.Loading}
    Please wait until we prepare a preview

  {:else if $fileImportData.previewStatus === States.Error}
    {$fileImportData.error ?? ''}

  {:else}
    To finish, review suggestions for the field types and column names.
    To ensure your import is correct we have included a preview of your first few rows.
  {/if}
</div>

{#if $fileImportData.previewColumns?.length > 0}
  <div class="preview-table">
    <table>
      <thead>
        <tr>
          {#each $fileImportData.previewColumns as column (column.name)}
            <PreviewColumn {column} on:typechange={typeChanged}/>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#key $fileImportData.previewColumns}
          <PreviewRows tableId={$fileImportData.previewId}
            columns={$fileImportData.previewColumns}
            bind:rows={$fileImportData.previewRows}/>
        {/key}
      </tbody>
    </table>
  </div>
{/if}

<style global lang="scss">
  @import "Preview.scss";
</style>
