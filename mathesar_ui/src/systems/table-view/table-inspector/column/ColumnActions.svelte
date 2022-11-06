<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import {
    iconDeleteMajor,
    iconMoveColumnsToNewLinkedTable,
    iconMoveColumnsToExistingLinkedTable,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import ExtractColumnsModal from './column-extraction/ExtractColumnsModal.svelte';
  import { ExtractColumnsModalController } from './column-extraction/ExtractColumnsModalController';

  export let columnsDataStore: ColumnsDataStore;
  export let columns: ProcessedColumn[];

  const extractColumns = new ExtractColumnsModalController(
    modal.getPropsForNewModal(),
  );

  $: column = columns.length === 1 ? columns[0] : undefined;
  $: s = columns.length > 1 ? 's' : '';

  function handleDeleteColumn(c: ProcessedColumn) {
    void confirmDelete({
      identifierType: 'column',
      identifierName: c.column.name,
      body: [
        'All objects related to this column will be affected.',
        'This could break existing tables and views.',
        'Are you sure you want to proceed?',
      ],
      onProceed: () => columnsDataStore.deleteColumn(c.id),
    });
  }

  function handleMoveColumnsToNewLinkedTable() {
    extractColumns.targetType.set('newTable');
    extractColumns.columns.set(columns);
    extractColumns.open();
  }

  function handleMoveColumnsToExistingLinkedTable() {
    extractColumns.targetType.set('existingTable');
    extractColumns.columns.set(columns);
    extractColumns.open();
  }
</script>

<div class="actions-container">
  {#if column}
    <Button
      appearance="plain"
      on:click={() => column && handleDeleteColumn(column)}
    >
      <Icon {...iconDeleteMajor} />
      <span>Delete Column</span>
    </Button>
  {/if}
  <Button appearance="plain" on:click={handleMoveColumnsToNewLinkedTable}>
    <Icon {...iconMoveColumnsToNewLinkedTable} />
    <span>New linked table from column{s}</span>
  </Button>
  <Button appearance="plain" on:click={handleMoveColumnsToExistingLinkedTable}>
    <Icon {...iconMoveColumnsToExistingLinkedTable} />
    <span>Move column{s} to existing linked table</span>
  </Button>
</div>

<ExtractColumnsModal controller={extractColumns} on:change/>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
</style>
