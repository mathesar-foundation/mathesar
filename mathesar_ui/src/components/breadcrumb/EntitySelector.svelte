<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { meta } from 'tinro';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import type { Database } from '@mathesar/models/Database';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import {
    getDataFormPageUrl,
    getExplorationPageUrl,
  } from '@mathesar/routes/urls';
  import { queries as queriesStore } from '@mathesar/stores/queries';
  import { currentTableId, currentTables } from '@mathesar/stores/tables';
  import { getLinkForTableItem } from '@mathesar/utils/tables';
  import { ensureReadable } from '@mathesar-component-library';

  import BreadcrumbSelector from './BreadcrumbSelector.svelte';
  import type {
    BreadcrumbSelectorEntryForDataForm,
    BreadcrumbSelectorEntryForExploration,
    BreadcrumbSelectorEntryForTable,
  } from './breadcrumbTypes';

  export let database: Database;
  export let schema: Schema;

  const schemaRouteContext = SchemaRouteContext.getSafe();
  $: dataFormsStore = ensureReadable($schemaRouteContext?.dataForms);
  $: dataFormsList = [...($dataFormsStore?.values() ?? [])];

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

  function makeDataFormBreadcrumbSelectorItem(
    dataForm: DataForm,
  ): BreadcrumbSelectorEntryForDataForm {
    return {
      type: 'dataForm',
      dataForm,
      getFilterableText: () => get(dataForm.structure).name,
      href: getDataFormPageUrl(database.id, schema.oid, dataForm.id),
      isActive() {
        const entryHref = getDataFormPageUrl(
          database.id,
          schema.oid,
          dataForm.id,
        );
        const currentHref = $currentRoute.url;
        return currentHref.startsWith(entryHref);
      },
    };
  }
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
    {
      label: $_('forms'),
      entries: dataFormsList.map(makeDataFormBreadcrumbSelectorItem),
      emptyMessage: $_('no_forms'),
    },
  ]}
  triggerLabel={$_('choose_table_or_exploration')}
/>
