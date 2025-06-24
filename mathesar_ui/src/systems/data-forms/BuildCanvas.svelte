<script lang="ts">
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { currentTablesData as tablesDataStore } from '@mathesar/stores/tables';
  import { Spinner, ensureReadable } from '@mathesar-component-library';

  import type { DataFormManager } from './DataFormManager';

  export let dataFormManager: DataFormManager;
  $: ({ ephemeralDataForm } = dataFormManager);

  // TODO: Retrieve table list based on schema, requires refactoring of tables store
  $: currentTable = $ephemeralDataForm.base_table_oid
    ? $tablesDataStore.tablesMap.get($ephemeralDataForm.base_table_oid)
    : undefined;
  $: tableStructure = currentTable
    ? new TableStructure({
        database: currentTable.schema.database,
        table: currentTable,
      })
    : undefined;
  $: tableStructureIsLoading = ensureReadable(tableStructure?.isLoading);

  function updateBaseTable(table: Table | undefined) {
    void dataFormManager.update((edf) =>
      edf.withBaseTable(table ? table.oid : undefined),
    );
  }
</script>

<div>
  {#if currentTable}
    {#if $tableStructureIsLoading}
      <Spinner />
    {:else}
      <div></div>
    {/if}
  {:else}
    <SelectTableWithinCurrentSchema
      autoSelect="none"
      value={currentTable}
      on:change={(e) => updateBaseTable(e.detail)}
    />
  {/if}
</div>

<style lang="scss">
</style>
