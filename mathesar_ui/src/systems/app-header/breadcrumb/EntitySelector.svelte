<script lang="ts">
  import { tables as tablesStore } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables';
  import {
    getTablePageUrl,
    getDataExplorerPageUrl,
  } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';
  import { queries as queriesStore } from '@mathesar/stores/queries';
  import type { QueryInstance } from '@mathesar/api/queries/queryList';
  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let database: Database;
  export let schema: SchemaEntry;

  function makeTableBreadcrumbSelectorItem(
    tableEntry: TableEntry,
  ): BreadcrumbSelectorEntry {
    return {
      label: tableEntry.name,
      href: getTablePageUrl(database.name, schema.id, tableEntry.id),
      icon: iconTable,
    };
  }

  function makeQueryBreadcrumbSelectorItem(
    queryInstance: QueryInstance,
  ): BreadcrumbSelectorEntry {
    return {
      label: queryInstance.name,
      href: getDataExplorerPageUrl(database.name, schema.id, queryInstance.id),
      icon: iconTable,
    };
  }

  $: tables = [...$tablesStore.data.values()];
  $: queries = [...$queriesStore.data.values()];

  $: selectorData = new Map([
    ['Tables', tables.map(makeTableBreadcrumbSelectorItem)],
    ['Explorations', queries.map(makeQueryBreadcrumbSelectorItem)],
  ]);
</script>

<BreadcrumbSelector
  data={selectorData}
  triggerLabel="Choose a Table or Exploration"
/>
