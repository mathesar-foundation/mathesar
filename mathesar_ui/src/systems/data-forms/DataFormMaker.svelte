<script lang="ts">
  import { _ } from 'svelte-i18n';

  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { TableStructure } from '@mathesar/stores/table-data';
  import CacheManager from '@mathesar/utils/CacheManager';
  import { Spinner, ensureReadable } from '@mathesar-component-library';

  import DataFormCanvas from './DataFormCanvas.svelte';
  import { DataFormManager } from './DataFormManager';
  import { EphemeralDataForm } from './EphemeralDataForm';

  export let schema: Schema;
  $: ({ name } = schema);

  const tableStructureCache = new CacheManager<Table['oid'], TableStructure>(
    10,
  );

  let baseTable: Table | undefined;
  $: tableStructureStore = baseTable
    ? (() => {
        const table = baseTable;
        return tableStructureCache.get(
          baseTable.oid,
          () => new TableStructure(table),
        ).asyncStore;
      })()
    : ensureReadable(undefined);
  $: dataFormManager = $tableStructureStore?.resolvedValue
    ? new DataFormManager(
        EphemeralDataForm.fromTable(
          $tableStructureStore.resolvedValue,
          tableStructureCache,
        ),
        tableStructureCache,
      )
    : undefined;
</script>

{#if dataFormManager}
  <DataFormCanvas {dataFormManager} />
{:else}
  <div class="choose-table">
    <div>
      {#if $tableStructureStore?.isLoading}
        <Spinner />
      {/if}

      {$name}
    </div>
    <SelectTableWithinCurrentSchema
      disabled={$tableStructureStore?.isLoading}
      autoSelect="none"
      bind:value={baseTable}
    />
  </div>
{/if}

<style lang="scss">
  .choose-table {
    position: inherit;
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem;
  }
</style>
