<script lang="ts">
  import { _ } from 'svelte-i18n';

  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { TableStructure } from '@mathesar/stores/table-data';
  import {
    DataFormCanvas,
    EditableDataFormManager,
    EphemeralDataForm,
  } from '@mathesar/systems/data-forms';
  import CacheManager from '@mathesar/utils/CacheManager';
  import { Spinner, ensureReadable } from '@mathesar-component-library';

  export let schema: Schema;
  $: ({ name } = schema);

  const tableStructureCache = new CacheManager<
    TableStructure['oid'],
    TableStructure
  >(10);

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
    ? new EditableDataFormManager(
        EphemeralDataForm.fromTable($tableStructureStore.resolvedValue),
        schema,
        tableStructureCache,
      )
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('form_maker'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
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
</LayoutWithHeader>

<style lang="scss">
  .choose-table {
    position: inherit;
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem;
  }
</style>
