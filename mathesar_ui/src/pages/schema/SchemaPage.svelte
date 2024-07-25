<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconEdit, iconSchema } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getSchemaPageExplorationsSectionUrl,
    getSchemaPageTablesSectionUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesStore } from '@mathesar/stores/tables';
  import { logEvent } from '@mathesar/utils/telemetry';
  import { Button, Icon, TabContainer } from '@mathesar-component-library';

  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';

  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import SchemaExplorations from './SchemaExplorations.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaTables from './SchemaTables.svelte';
  import TableSkeleton from './TableSkeleton.svelte';

  export let database: Database;
  export let schema: Schema;
  export let section: string;

  const addEditModal = modal.spawnModalController();

  // NOTE: This has to be same as the name key in the paths prop of Route component
  type TabsKey = 'overview' | 'tables' | 'explorations';
  type TabItem = {
    label: string;
    id: TabsKey;
    count?: number;
    href: string;
  };

  $: tablesMap = $tablesStore.tablesMap;
  $: explorationsMap = $queries.data;
  $: tablesRequestStatus = $tablesStore.requestStatus;
  $: explorationsRequestStatus = $queries.requestStatus;

  $: tabs = [
    {
      label: $_('overview'),
      id: 'overview',
      href: getSchemaPageUrl(database.id, schema.oid),
    },
    {
      label: $_('tables'),
      id: 'tables',
      count: tablesMap.size,
      href: getSchemaPageTablesSectionUrl(database.id, schema.oid),
    },
    {
      label: $_('explorations'),
      id: 'explorations',
      count: explorationsMap.size,
      href: getSchemaPageExplorationsSectionUrl(database.id, schema.oid),
    },
  ] as TabItem[];

  $: activeTab = tabs.find((tab) => tab.id === section) || tabs[0];

  function handleEditSchema() {
    addEditModal.open();
  }

  $: isDefault = schema.name === 'public';

  logEvent('opened_schema', {
    database_name: database.name,
    schema_name: schema.name,
    source: 'schema_page',
  });
</script>

<svelte:head><title>{makeSimplePageTitle(schema.name)}</title></svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <AppSecondaryHeader
    slot="secondary-header"
    theme="light"
    pageTitleAndMetaProps={{
      name: schema.name,
      type: 'schema',
      icon: iconSchema,
    }}
  >
    <div slot="action">
      {#if !isDefault}
        <Button on:click={handleEditSchema} appearance="secondary">
          <Icon {...iconEdit} />
          <span>{$_('edit_schema')}</span>
        </Button>
      {/if}
    </div>

    <svelte:fragment slot="bottom">
      {#if schema.description}
        <span class="description">
          {schema.description}
        </span>
      {/if}
    </svelte:fragment>
  </AppSecondaryHeader>

  <TabContainer {activeTab} {tabs} uniformTabWidth={false}>
    <div slot="tab" let:tab class="tab-header-container">
      <span>{tab.label}</span>
      {#if tab.count !== undefined}
        <span class="count">{tab.count}</span>
      {/if}
    </div>
    {#if activeTab?.id === 'overview'}
      <div class="tab-container">
        <SchemaOverview
          {tablesRequestStatus}
          {tablesMap}
          {explorationsMap}
          {database}
          {schema}
          {explorationsRequestStatus}
        />
      </div>
    {:else if activeTab?.id === 'tables'}
      <div class="tab-container">
        {#if tablesRequestStatus.state === 'processing'}
          <TableSkeleton numTables={schema.table_count} />
        {:else}
          <SchemaTables {tablesMap} {database} {schema} />
        {/if}
      </div>
    {:else if activeTab?.id === 'explorations'}
      <div class="tab-container">
        {#if explorationsRequestStatus.state === 'processing'}
          <ExplorationSkeleton />
        {:else}
          <SchemaExplorations
            hasTablesToExplore={!!tablesMap.size}
            {explorationsMap}
            {database}
            {schema}
          />
        {/if}
      </div>
    {/if}
  </TabContainer>
</LayoutWithHeader>

<AddEditSchemaModal controller={addEditModal} {database} {schema} />

<style lang="scss">
  .tab-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .tab-header-container {
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.25rem;
    }

    .count {
      border-radius: var(--border-radius-l);
      background: var(--slate-200);
      font-size: var(--text-size-small);
      text-align: center;
      padding: 0.071rem 0.5rem;
      margin-left: 0.5rem;
    }
  }
</style>
