<script lang="ts">
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let column: ProcessedColumn;
  export let columnsDataStore: ColumnsDataStore;

  $: ({ columns } = columnsDataStore);

  function getValidationErrors(newName: string): string[] {
    if (newName === column.column.name) {
      return [];
    }
    if (!newName) {
      return ['Name cannot be empty.'];
    }
    const columnNames = $columns.map((c) => c.name);
    if (columnNames.includes(newName)) {
      return ['A column with that name already exists.'];
    }
    return [];
  }

  async function handleColumnNameChange(newName: string): Promise<void> {
    try {
      await columnsDataStore.rename(column.id, newName);
    } catch (error) {
      toast.error(`Unable to rename column. ${getErrorMessage(error)}`);
    }
  }
</script>

<div class="rename-column-property-container">
  <span>Name</span>
  <EditableTextWithActions
    initialValue={column.column.name}
    onSubmit={handleColumnNameChange}
    {getValidationErrors}
  />
</div>

<style lang="scss">
  .rename-column-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
