<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { queries } from '@mathesar/stores/queries';
  import {
    tables as tablesStore,
    importVerifiedTables as importVerifiedTablesStore,
  } from '@mathesar/stores/tables';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconSchema, iconEdit } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { Button, TabContainer, Icon } from '@mathesar-component-library';
  import {
    getSchemaPageExplorationsSectionUrl,
    getSchemaPageTablesSectionUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { States } from '@mathesar/api/utils/requestUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { onMount } from 'svelte';
  import { logEvent } from '@mathesar/utils/telemetry';
  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaTables from './SchemaTables.svelte';
  import SchemaExplorations from './SchemaExplorations.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let section: string;

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: canExecuteDDL =
    userProfile?.hasPermission({ database, schema }, 'canExecuteDDL') ?? false;
  $: canEditMetadata =
    userProfile?.hasPermission({ database, schema }, 'canEditMetadata') ??
    false;

  const addEditModal = modal.spawnModalController();

  // NOTE: This has to be same as the name key in the paths prop of Route component
  type TabsKey = 'overview' | 'tables' | 'explorations';
  type TabItem = {
    label: string;
    id: TabsKey;
    count?: number;
    href: string;
  };

  $: tablesMap = canExecuteDDL ? $tablesStore.data : $importVerifiedTablesStore;
  $: explorationsMap = $queries.data;
  $: isTablesLoading = $tablesStore.state === States.Loading;
  $: isExplorationsLoading = $queries.requestStatus.state === 'processing';

  $: tabs = [
    {
      label: 'Overview',
      id: 'overview',
      href: getSchemaPageUrl(database.name, schema.id),
    },
    {
      label: 'Tables',
      id: 'tables',
      count: tablesMap.size,
      href: getSchemaPageTablesSectionUrl(database.name, schema.id),
    },
    {
      label: 'Explorations',
      id: 'explorations',
      count: explorationsMap.size,
      href: getSchemaPageExplorationsSectionUrl(database.name, schema.id),
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
  cssVariables={{ '--max-layout-width': '72rem' }}
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
    <svelte:fragment slot="action">
      {#if !isDefault && canExecuteDDL}
        <Button on:click={handleEditSchema} appearance="secondary">
          <Icon {...iconEdit} />
          <span>Edit Schema</span>
        </Button>
      {/if}
    </svelte:fragment>

    <slot slot="bottom">
      {#if schema.description}
        <span class="description">
          {schema.description}
        </span>
      {/if}
    </slot>
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
          {canExecuteDDL}
          {canEditMetadata}
          {isTablesLoading}
          {isExplorationsLoading}
          {tablesMap}
          {explorationsMap}
          {database}
          {schema}
        />
      </div>
    {:else if activeTab?.id === 'tables'}
      <div class="tab-container">
        {#if isTablesLoading}
          <TableSkeleton />
        {:else}
          <SchemaTables {canExecuteDDL} {tablesMap} {database} {schema} />
        {/if}
      </div>
    {:else if activeTab?.id === 'explorations'}
      <div class="tab-container">
        {#if isExplorationsLoading}
          <ExplorationSkeleton />
        {:else}
          <SchemaExplorations
            {canEditMetadata}
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
