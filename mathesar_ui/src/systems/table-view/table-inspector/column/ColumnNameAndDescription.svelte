<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import type {
    ColumnsDataStore,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let column: ProcessedColumn;
  export let columnsDataStore: ColumnsDataStore;
  export let currentRoleOwnsTable: boolean;

  $: ({ columns } = columnsDataStore);

  function getValidationErrors(newName: string): string[] {
    if (newName === column.column.name) {
      return [];
    }
    if (!newName) {
      return [$_('column_name_cannot_be_empty')];
    }
    const columnNames = $columns.map((c) => c.name);
    if (columnNames.includes(newName)) {
      return [$_('column_name_already_exists')];
    }
    return [];
  }

  async function handleColumnNameChange(newName: string): Promise<void> {
    try {
      await columnsDataStore.rename(column.id, newName);
    } catch (error) {
      toast.error(`${$_('unable_to_rename_column')} ${getErrorMessage(error)}`);
    }
  }

  async function handleColumnDescriptionChange(
    description: string,
  ): Promise<void> {
    try {
      await columnsDataStore.updateDescription(column.id, description ?? null);
    } catch (error) {
      toast.error(
        `${$_('unable_to_update_column_desc')} ${getErrorMessage(error)}`,
      );
    }
  }
</script>

<div class="column-property column-name">
  <span class="label">{$_('column_name')}</span>
  <EditableTextWithActions
    initialValue={column.column.name}
    onSubmit={handleColumnNameChange}
    {getValidationErrors}
    disabled={!currentRoleOwnsTable}
  />
</div>

<div class="column-property column-description">
  <span class="label">{$_('column_description')}</span>
  <EditableTextWithActions
    initialValue={column.column.description ?? ''}
    onSubmit={handleColumnDescriptionChange}
    isLongText
    disabled={!currentRoleOwnsTable}
  />
</div>

<style lang="scss">
  .column-property {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }
</style>
