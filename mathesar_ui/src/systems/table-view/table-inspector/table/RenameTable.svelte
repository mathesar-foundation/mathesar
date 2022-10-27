<script lang="ts">
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    refetchTablesForSchema,
    renameTable,
    tables,
  } from '@mathesar/stores/tables';

  function schemaContainsTableName(name: string): boolean {
    const { id } = $tabularData;

    const allTables = [...$tables.data.values()];
    const tablesUsingName = allTables.filter(
      (current) => current.name === name,
    );

    return tablesUsingName.length > 0 && tablesUsingName[0].id !== id;
  }

  function getValidationErrors(name: string): string[] {
    if (!name.trim()) {
      return ['Name cannot be empty.'];
    }
    if (schemaContainsTableName(name)) {
      return ['A table with that name already exists.'];
    }
    return [];
  }

  const tabularData = getTabularDataStoreFromContext();

  async function handleTableNameChange(name: string): Promise<void> {
    const { id } = $tabularData;
    await renameTable(id, name);
    if ($currentSchemaId) {
      await refetchTablesForSchema($currentSchemaId);
    }
  }
</script>

<div class="rename-table-property-container">
  <span class="label">Name</span>
  <EditableTextWithActions
    initialValue={$tables.data.get($tabularData.id)?.name ?? ''}
    onSubmit={handleTableNameChange}
    {getValidationErrors}
  />
</div>

<style lang="scss">
  .rename-table-property-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
