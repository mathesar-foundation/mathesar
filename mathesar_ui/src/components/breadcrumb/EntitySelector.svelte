<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { meta } from 'tinro';

  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Table } from '@mathesar/api/rpc/tables';
  import type { Database } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { queries as queriesStore } from '@mathesar/stores/queries';
  import { currentTableId, currentTables } from '@mathesar/stores/tables';
  import { getLinkForTableItem } from '@mathesar/utils/tables';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type {
    BreadcrumbSelectorEntry,
    BreadcrumbSelectorEntryForTable,
    SimpleBreadcrumbSelectorEntry,
  } from './breadcrumbTypes';

  export let database: Database;
  export let schema: Schema;

  function makeTableBreadcrumbSelectorItem(
    table: Table,
  ): BreadcrumbSelectorEntryForTable {
    return {
      type: 'table',
      table,
      label: table.name,
      href: getLinkForTableItem(database.id, schema.oid, table),
      icon: iconTable,
      isActive() {
        return table.oid === $currentTableId;
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
      href: getExplorationPageUrl(database.id, schema.oid, queryInstance.id),
      icon: iconTable,
      isActive() {
        // TODO we don't have a store for what the current query is, so we fallback to comparing hrefs.
        const entryhref = getExplorationPageUrl(
          database.id,
          schema.oid,
          queryInstance.id,
        );
        const currentHref = $currentRoute.url;
        return currentHref.startsWith(entryhref);
      },
    };
  }

  $: queries = [...$queriesStore.data.values()];

  $: selectorData = new Map<string, BreadcrumbSelectorEntry[]>([
    [$_('tables'), $currentTables.map(makeTableBreadcrumbSelectorItem)],
    [$_('explorations'), queries.map(makeQueryBreadcrumbSelectorItem)],
  ]);
</script>

<BreadcrumbSelector
  data={selectorData}
  triggerLabel={$_('choose_table_or_exploration')}
/>
