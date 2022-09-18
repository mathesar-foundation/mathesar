<script lang="ts">
  import { meta } from 'tinro';
  import {
    currentTableId,
    tables as tablesStore,
  } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables';
  import {
    getTablePageUrl,
    getDataExplorerPageUrl,
  } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';
  import { queries as queriesStore } from '@mathesar/stores/queries';
  import type { QueryInstance } from '@mathesar/api/queries';
  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type {
    BreadcrumbSelectorEntry,
    SimpleBreadcrumbSelectorEntry,
    BreadcrumbSelectorEntryForTable,
  } from './breadcrumbTypes';

  export let database: Database;
  export let schema: SchemaEntry;

  function makeTableBreadcrumbSelectorItem(
    table: TableEntry,
  ): BreadcrumbSelectorEntryForTable {
    return {
      type: 'table',
      table,
      label: table.name,
      href: getTablePageUrl(database.name, schema.id, table.id),
      icon: iconTable,
      isActive() {
        return table.id === $currentTableId;
      },
    };
  }

  const currentRoute = meta();

  function makeQueryBreadcrumbSelectorItem(
    queryInstance: QueryInstance,
  ): SimpleBreadcrumbSelectorEntry {
    return {
      type: 'simple',
      label: queryInstance.name,
      href: getDataExplorerPageUrl(database.name, schema.id, queryInstance.id),
      icon: iconTable,
      isActive() {
        // TODO we don't have a store for what the current query is, so we fallback to comparing hrefs.
        const entryhref = getDataExplorerPageUrl(
          database.name,
          schema.id,
          queryInstance.id,
        );
        const currentHref = $currentRoute.url;
        return currentHref.startsWith(entryhref);
      },
    };
  }

  $: tables = [...$tablesStore.data.values()];
  $: queries = [...$queriesStore.data.values()];

  $: selectorData = new Map<string, BreadcrumbSelectorEntry[]>([
    ['Tables', tables.map(makeTableBreadcrumbSelectorItem)],
    ['Explorations', queries.map(makeQueryBreadcrumbSelectorItem)],
  ]);
</script>

<BreadcrumbSelector
  data={selectorData}
  triggerLabel="Choose a Table or Exploration"
/>
