<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { router } from 'tinro';

  import {
    CancelOrProceedButtonPair,
    Checkbox,
    LabeledInput,
    Spinner,
    TextInput,
  } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconDelete } from '@mathesar/icons';
  import { getTablePageUrl, getSchemaPageUrl } from '@mathesar/routes/urls';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { setInFileStore } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';
  import {
    cancelImport,
    fetchPreviewTableInfo,
    finishImport,
    updateDataFileHeader,
  } from '../importUtils';
  import PreviewColumn from './PreviewColumn.svelte';
  import PreviewRows from './PreviewRows.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let fileImportStore: FileImport;

  onMount(() => {
    void fetchPreviewTableInfo(fileImportStore);
  });

  $: isLoading =
    $fileImportStore.previewStatus === States.Loading ||
    $fileImportStore.previewRowsLoadStatus === States.Loading;
  $: canProceed =
    $fileImportStore.previewStatus === States.Done &&
    $fileImportStore.previewRowsLoadStatus === States.Done;

  function handleChangeType(e: CustomEvent) {
    const { previewColumns } = get(fileImportStore);
    if (!previewColumns) {
      return;
    }
    const changedColumn = previewColumns.find(
      (column) => column.name === e.detail.name,
    );
    if (!changedColumn) {
      return;
    }
    changedColumn.type = e.detail.type as string;
    setInFileStore(fileImportStore, {
      previewColumns: [...previewColumns],
    });
  }

  function handleCancel() {
    cancelImport(fileImportStore);
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }

  async function handleProceed() {
    const tableId = await finishImport(fileImportStore);
    if (tableId !== undefined) {
      router.goto(getTablePageUrl(database.name, schema.id, tableId));
    }
  }
</script>

<h2>Confirm your data</h2>

<div class="help-content">
  {#if $fileImportStore.previewStatus === States.Loading}
    Please wait until we prepare a preview
  {:else if $fileImportStore.previewStatus === States.Error}
    {$fileImportStore.error ?? ''}
  {:else}
    To finish, review suggestions for the field types and column names. To
    ensure your import is correct we have included a preview of your first few
    rows.
  {/if}
</div>

<div class="table-config-options">
  <div class="name">
    Table name: <TextInput bind:value={$fileImportStore.name} />
  </div>

  <LabeledInput label="Use first row as header" layout="inline-input-first">
    <Checkbox
      bind:checked={$fileImportStore.firstRowHeader}
      disabled={$fileImportStore.previewStatus === States.Loading}
      on:change={({ detail }) => updateDataFileHeader(fileImportStore, detail)}
    />
  </LabeledInput>
</div>

<div class="preview-table-header">
  Preview
  {#if isLoading}<Spinner />{/if}
</div>

{#if $fileImportStore.previewColumns?.length}
  <div
    class="preview-table"
    class:disabled={$fileImportStore.previewStatus === States.Loading}
  >
    <table>
      <thead>
        <tr>
          {#each $fileImportStore.previewColumns as column (column.name)}
            <PreviewColumn {column} on:typechange={handleChangeType} />
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

{#if !isLoading}
  <CancelOrProceedButtonPair
    onCancel={handleCancel}
    onProceed={handleProceed}
    cancelButton={{ icon: iconDelete }}
    proceedButton={{ label: 'Finish Import' }}
    {canProceed}
  />
{/if}

<style lang="scss">
  .table-config-options {
    margin-top: 1rem;
    .name {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;

      :global(.text-input) {
        width: 15rem;
        margin-left: 0.8rem;
      }
    }
  }

  .preview-table-header {
    font-weight: 500;
    margin-top: 20px;
    font-size: 1.2rem;
    height: 20px;
    display: flex;
    align-items: center;

    :global(svg) {
      margin-left: 6px;
    }
  }

  .preview-table {
    overflow: auto;
    max-height: 400px;
    position: relative;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 10px 0px 20px;

    &.disabled {
      background: #efefef;
      pointer-events: none;
    }

    table {
      border-collapse: collapse;

      :global(th:not(:first-child)),
      :global(td:not(:first-child)) {
        border-left: 1px solid #e0e0e0;
      }
    }
  }
</style>
