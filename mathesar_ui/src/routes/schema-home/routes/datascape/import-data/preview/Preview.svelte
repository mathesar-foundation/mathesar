<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    TextInput,
    LabeledInput,
    Checkbox,
    Spinner,
    CancelOrProceedButtonPair,
  } from '@mathesar-component-library';
  import { setInFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { States } from '@mathesar/utils/api';
  import { iconDelete } from '@mathesar/icons';
  import PreviewColumn from './PreviewColumn.svelte';
  import PreviewRows from './PreviewRows.svelte';
  import {
    updateDataFileHeader,
    finishImport,
    fetchPreviewTableInfo,
    cancelImport,
  } from '../importUtils';

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
    onCancel={() => cancelImport(fileImportStore)}
    onProceed={() => finishImport(fileImportStore)}
    cancelButton={{ icon: iconDelete }}
    proceedButton={{ label: 'Finish Import' }}
    {canProceed}
  />
{/if}

<style global lang="scss">
  @import 'Preview.scss';
</style>
