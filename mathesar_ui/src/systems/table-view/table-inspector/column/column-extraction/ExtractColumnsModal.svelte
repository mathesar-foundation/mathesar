<script lang="ts">
  import {
    ControlledModal,
    CancelOrProceedButtonPair,
    LabeledInput,
    TextInput,
  } from '@mathesar-component-library';
  import type { ExtractColumnsModalController } from './ExtractColumnsModalController';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import SelectProcessedColumns from '@mathesar/components/SelectProcessedColumns.svelte';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import { getLinkedTables } from './columnExtractionUtils';
  import SelectLinkedTable from './SelectLinkedTable.svelte';
  import type { LinkedTable } from './columnExtractionTypes';

  const tabularData = getTabularDataStoreFromContext();

  export let controller: ExtractColumnsModalController;

  let linkedTable: LinkedTable | undefined = undefined;
  let tableName = '';
  let newFkColumnName = '';

  $: ({ processedColumns, constraintsDataStore } = $tabularData);
  $: ({ constraints } = $constraintsDataStore);
  $: availableColumns = [...$processedColumns.values()];
  $: ({ targetType, columns } = controller);
  $: canProceed = true;
  $: proceedButtonLabel =
    $targetType === 'existingTable' ? 'Move Columns' : 'Create Table';
  $: linkedTables = getLinkedTables({
    constraints,
    columns: $processedColumns,
    tables: $tablesDataStore.data,
  });

  function init() {
    tableName = '';
    newFkColumnName = '';
  }

  function handleTableNameUpdate() {
    newFkColumnName = tableName;
  }

  async function handleSave() {}
</script>

<ControlledModal {controller} on:open={init}>
  <span slot="title">
    {#if $targetType === 'existingTable'}
      Move Columns to Linked Table
    {:else}
      New Linked Table From Columns
    {/if}
  </span>

  <Form>
    {#if $targetType === 'newTable'}
      <FormField>
        <LabeledInput layout="stacked">
          <span slot="label">Name of New Table</span>
          <TextInput bind:value={tableName} on:input={handleTableNameUpdate} />
        </LabeledInput>
      </FormField>

      <FormField>
        <LabeledInput layout="stacked">
          <span slot="label">Name of New Linking Column In This Table</span>
          <TextInput bind:value={newFkColumnName} />
        </LabeledInput>
      </FormField>
    {/if}

    {#if $targetType === 'existingTable'}
      <FormField>
        <LabeledInput layout="stacked">
          <span slot="label" class="label">
            <span class="title">Linked Table</span>
            <span class="help" />
          </span>
          <SelectLinkedTable {linkedTables} bind:value={linkedTable} />
        </LabeledInput>
      </FormField>
    {/if}

    <FormField>
      <LabeledInput layout="stacked">
        <span slot="label" class="label">
          <span class="title">Columns to Move</span>
          <span class="help">
            These columns will be removed from the current table and moved to
            the linked table.
          </span>
        </span>
        <SelectProcessedColumns {availableColumns} bind:columns={$columns} />
      </LabeledInput>
    </FormField>
  </Form>

  <CancelOrProceedButtonPair
    slot="footer"
    onProceed={handleSave}
    onCancel={() => controller.close()}
    proceedButton={{ label: proceedButtonLabel }}
    {canProceed}
  />
</ControlledModal>

<style>
  .label {
    display: block;
  }
  .title {
    display: block;
  }
  .help {
    display: block;
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    margin-top: 0.5rem;
  }
</style>
