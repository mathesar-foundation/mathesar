<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    refetchTablesForCurrentSchema,
    currentTables,
  } from '@mathesar/stores/tables';
  import type { AtLeastOne } from '@mathesar/typeUtils';

  export let tableId: number;

  function schemaContainsTableName(name: string): boolean {
    return $currentTables.some((t) => t.name === name && t.oid !== tableId);
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
    // await updateTableMetaData(tableId, data);

    // TODO_3651:
    // - Modify name and description.
    // - Rename this function so that it doesn't mention metadata.
    await refetchTablesForCurrentSchema();
  }
</script>

<slot {getNameValidationErrors} onUpdate={handleTableMetaUpdate} />
