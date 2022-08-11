<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables/tableList';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Filtering, Grouping, Sorting } from '@mathesar/stores/table-data';
  import { TabularData } from '@mathesar/stores/table-data/tabularData';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import Pagination from '@mathesar/utils/Pagination';
  import { router } from 'tinro';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData(
    {
      id: table.id,
      metaProps: {
        pagination: new Pagination(),
        sorting: new Sorting(),
        grouping: new Grouping(),
        filtering: new Filtering(),
      },
    },
    abstractTypesMap,
  );

  function handleDeleteTable() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }
</script>

<svelte:head>
  <title>{table.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <TableView
    {schema}
    {table}
    {tabularData}
    on:deleteTable={handleDeleteTable}
  />
</LayoutWithHeader>
