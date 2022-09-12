<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import {
    iconDelete,
    iconMoveColumnsToNewLinkedTable,
    iconMoveColumnsToExistingLinkedTable,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data/types';

  export let columnsDataStore: ColumnsDataStore;
  export let columns: ProcessedColumn[];

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
</script>

<div class="actions-container">
  {#if column}
    <Button
      appearance="ghost"
      on:click={() => column && handleDeleteColumn(column)}
    >
      <Icon {...iconDelete} />
      <span>Delete Column</span>
    </Button>
  {/if}
  <Button appearance="plain" on:click={() => {}}>
    <Icon {...iconMoveColumnsToNewLinkedTable} />
    <span>New linked table from column{s}</span>
  </Button>
  <Button appearance="plain" on:click={() => {}}>
    <Icon {...iconMoveColumnsToExistingLinkedTable} />
    <span>Move column{s} to existing linked table</span>
  </Button>
</div>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
</style>
