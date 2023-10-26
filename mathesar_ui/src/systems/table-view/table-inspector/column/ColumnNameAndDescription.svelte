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
  export let canExecuteDDL: boolean;

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

  async function handleColumnDescriptionChange(
    description: string,
  ): Promise<void> {
    try {
      await columnsDataStore.updateDescription(column.id, description ?? null);
    } catch (error) {
      toast.error(
        `Unable to update column description. ${getErrorMessage(error)}`,
      );
    }
  }
</script>

<div class="column-property column-name">
  <span>Name</span>
  <EditableTextWithActions
    initialValue={column.column.name}
    onSubmit={handleColumnNameChange}
    {getValidationErrors}
    disabled={!canExecuteDDL}
  />
</div>

<div class="column-property column-description">
  <span>Description</span>
  <EditableTextWithActions
    initialValue={column.column.description ?? ''}
    onSubmit={handleColumnDescriptionChange}
    isLongText
    disabled={!canExecuteDDL}
  />
</div>

<style lang="scss">
  .column-property {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
