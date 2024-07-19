<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    refetchTablesForSchema,
    tables,
    updateTableMetaData,
  } from '@mathesar/stores/tables';
  import type { AtLeastOne } from '@mathesar/typeUtils';

  export let tableId: number;

  function schemaContainsTableName(name: string): boolean {
    const allTables = [...$tables.data.values()];
    const tablesUsingName = allTables.filter(
      (current) => current.name === name,
    );

    return tablesUsingName.length > 0 && tablesUsingName[0].oid !== tableId;
  }

  function getNameValidationErrors(name: string): string[] {
    if (!name.trim()) {
      return [$_('table_name_cannot_be_empty')];
    }
    if (schemaContainsTableName(name)) {
      return [$_('table_with_name_already_exists')];
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
