<script lang="ts">
  import { router } from 'tinro';

  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Meta } from '@mathesar/stores/table-data';
  import { TabularData } from '@mathesar/stores/table-data/tabularData';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: ({ hash } = $router);
  $: meta = Meta.fromSerialization(hash);
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta,
  });

  function handleMetaSerializationChange(s: string) {
    router.location.hash.set(s);
  }
  $: metaSerialization = tabularData.meta.serialization;
  $: handleMetaSerializationChange($metaSerialization);

  function handleDeleteTable() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }
</script>

<svelte:head>
  <title>{table.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <TableView
    {database}
    {schema}
    {table}
    {tabularData}
    on:deleteTable={handleDeleteTable}
  />
</LayoutWithHeader>
