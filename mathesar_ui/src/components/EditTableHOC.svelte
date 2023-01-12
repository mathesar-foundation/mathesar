<script lang="ts">
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    refetchTablesForSchema,
    updateTableMetaData,
    tables,
  } from '@mathesar/stores/tables';
  import type { AtLeastOne } from '@mathesar/typeUtils';

  export let tableId: number;

  function schemaContainsTableName(name: string): boolean {
    const allTables = [...$tables.data.values()];
    const tablesUsingName = allTables.filter(
      (current) => current.name === name,
    );

    return tablesUsingName.length > 0 && tablesUsingName[0].id !== tableId;
  }

  function getNameValidationErrors(name: string): string[] {
    if (!name.trim()) {
      return ['Name cannot be empty.'];
    }
    if (schemaContainsTableName(name)) {
      return ['A table with that name already exists.'];
    }
    return [];
  }

  async function handleTableMetaUpdate(
    data: AtLeastOne<{ name: string; description: string }>,
  ): Promise<void> {
    await updateTableMetaData(tableId, data);
    if ($currentSchemaId) {
      await refetchTablesForSchema($currentSchemaId);
    }
  }
</script>

<slot {getNameValidationErrors} onUpdate={handleTableMetaUpdate} />
