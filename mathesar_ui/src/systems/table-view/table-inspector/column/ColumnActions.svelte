<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import { iconDelete, iconQuery, iconTableLink } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data/types';
  import { createEventDispatcher } from 'svelte';

  export let columnsDataStore: ColumnsDataStore;
  export let column: ProcessedColumn;

  const dispatch = createEventDispatcher();

  function handleDeleteColumn() {
    dispatch('close');
    void confirmDelete({
      identifierType: 'column',
      identifierName: column.column.name,
      body: [
        'All objects related to this column will be affected.',
        'This could break existing tables and views.',
        'Are you sure you want to proceed?',
      ],
      onProceed: () => columnsDataStore.deleteColumn(column.id),
    });
  }
</script>

<div class="actions-container">
  <Button appearance="ghost" on:click={handleDeleteColumn}>
    <Icon {...iconDelete} />
    <span>Delete Column</span>
  </Button>
</div>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
</style>
