<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import {
    ControlledModal,
    CancelOrProceedButtonPair,
    LabeledInput,
    TextInput,
  } from '@mathesar-component-library';
  import type { ExtractColumnsModalController } from './ExtractColumnsModalController';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import SelectProcessedColumns from '@mathesar/components/SelectProcessedColumns.svelte';
  import SelectTable from '@mathesar/components/SelectTable.svelte';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let controller: ExtractColumnsModalController;

  let table: TableEntry | undefined = undefined;
  // TODO init
  let tableName = '';
  let newFkColumnName = '';

  $: ({ processedColumns } = $tabularData);
  $: availableColumns = [...$processedColumns.values()];
  $: ({ targetType, columns } = controller);
  $: canProceed = true;
  $: proceedButtonLabel =
    $targetType === 'existingTable' ? 'Move Columns' : 'Create Table';
  $: tables = [...$tablesDataStore.data.values()];

  async function handleSave() {}
</script>

<ControlledModal {controller}>
  <span slot="title">
    {#if $targetType === 'existingTable'}
      Move Columns to Linked Table
    {:else}
      New Linked Table From Columns
    {/if}
  </span>

  {#if $targetType === 'newTable'}
    <LabeledInput layout="stacked">
      <span slot="label">Table Name</span>
      <TextInput bind:value={tableName} />
    </LabeledInput>

    <LabeledInput layout="stacked">
      <span slot="label">Link Column Name</span>
      <TextInput bind:value={newFkColumnName} />
    </LabeledInput>
  {/if}

  {#if $targetType === 'existingTable'}
    <LabeledInput layout="stacked">
      <span slot="label">Linked Table</span>
      <SelectTable {tables} bind:table />
    </LabeledInput>
  {/if}

  <LabeledInput layout="stacked">
    <span slot="label">Columns to Move</span>
    <SelectProcessedColumns {availableColumns} bind:columns={$columns} />
  </LabeledInput>

  <CancelOrProceedButtonPair
    slot="footer"
    onProceed={handleSave}
    onCancel={() => controller.close()}
    proceedButton={{ label: proceedButtonLabel }}
    {canProceed}
  />
</ControlledModal>
