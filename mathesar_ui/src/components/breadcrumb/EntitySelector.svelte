<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { meta } from 'tinro';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { queries as queriesStore } from '@mathesar/stores/queries';
  import { currentTableId, currentTables } from '@mathesar/stores/tables';
  import { getLinkForTableItem } from '@mathesar/utils/tables';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type {
    BreadcrumbSelectorEntryForExploration,
    BreadcrumbSelectorEntryForTable,
  } from './breadcrumbTypes';

  export let database: Database;
  export let schema: Schema;

  function makeTableBreadcrumbSelectorItem(
    table: Table,
  ): BreadcrumbSelectorEntryForTable {
    return {
      type: 'table',
      table,
      getFilterableText: () => table.name,
      href: getLinkForTableItem(database.id, schema.oid, table),
      isActive() {
        return table.oid === $currentTableId;
      },
    };
  }

  const currentRoute = meta();

  function makeQueryBreadcrumbSelectorItem(
    exploration: SavedExploration,
  ): BreadcrumbSelectorEntryForExploration {
    return {
      type: 'exploration',
      exploration,
      getFilterableText: () => exploration.name,
      href: getExplorationPageUrl(database.id, schema.oid, exploration.id),
      isActive() {
        // TODO we don't have a store for what the current query is, so we fallback to comparing hrefs.
        const entryhref = getExplorationPageUrl(
          database.id,
          schema.oid,
          exploration.id,
        );
        const currentHref = $currentRoute.url;
        return currentHref.startsWith(entryhref);
      },
    };
  }

  $: queries = [...$queriesStore.data.values()];
</script>

<BreadcrumbSelector
  sections={[
    {
      label: $_('tables'),
      entries: $currentTables.map(makeTableBreadcrumbSelectorItem),
      emptyMessage: $_('no_tables'),
    },
    {
      label: $_('explorations'),
      entries: queries.map(makeQueryBreadcrumbSelectorItem),
      emptyMessage: $_('no_explorations'),
    },
  ]}
  triggerLabel={$_('choose_table_or_exploration')}
/>
