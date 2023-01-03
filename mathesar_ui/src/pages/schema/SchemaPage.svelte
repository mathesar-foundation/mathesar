<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { queries } from '@mathesar/stores/queries';
  import { tables as tablesStore } from '@mathesar/stores/tables';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconSchema, iconEdit } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { Button, TabContainer, Icon } from '@mathesar-component-library';
  import type { TabEvents } from '@mathesar/component-library/tabs/TabContainerTypes';
  import { router } from 'tinro';
  import {
    getSchemaPageExplorationsSectionUrl,
    getSchemaPageTablesSectionUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { States } from '@mathesar/api/utils/requestUtils';
  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaTables from './SchemaTables.svelte';
  import SchemaExplorations from './SchemaExplorations.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let section: string;

  const addEditModal = modal.spawnModalController();

  // NOTE: This has to be same as the name key in the paths prop of Route component
  type TabsKey = 'overview' | 'tables' | 'explorations';
  type TabItem = {
    label: string;
    id: TabsKey;
    count?: number;
    getUrl: () => string;
  };

  $: tablesMap = $tablesStore.data;
  $: explorationsMap = $queries.data;
  $: isTablesLoading = $tablesStore.state === States.Loading;
  $: isExplorationsLoading = $queries.requestStatus.state === 'processing';

  $: tabs = [
    {
      label: 'Overview',
      id: 'overview',
      getUrl: () => getSchemaPageUrl(database.name, schema.id),
    },
    {
      label: 'Tables',
      id: 'tables',
      count: tablesMap.size,
      getUrl: () => getSchemaPageTablesSectionUrl(database.name, schema.id),
    },
    {
      label: 'Explorations',
      id: 'explorations',
      count: explorationsMap.size,
      getUrl: () =>
        getSchemaPageExplorationsSectionUrl(database.name, schema.id),
    },
  ] as TabItem[];

  $: activeTab = tabs.find((tab) => tab.id === section) || tabs[0];

  function handleEditSchema() {
    addEditModal.open();
  }

  function handleTabSelected(event: CustomEvent<TabEvents['tabSelected']>) {
    const selectedTab = event.detail.tab as TabItem;
    router.goto(selectedTab.getUrl());
  }
</script>

<svelte:head><title>{makeSimplePageTitle(schema.name)}</title></svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{ '--max-layout-width': '64rem' }}
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
    <Button slot="action" on:click={handleEditSchema} appearance="secondary">
      <Icon {...iconEdit} />
      <span>Edit Schema</span>
    </Button>
    <slot slot="bottom">
      {#if schema.description}
        <span class="description">
          {schema.description}
        </span>
      {/if}
    </slot>
  </AppSecondaryHeader>

  <TabContainer
    {activeTab}
    {tabs}
    uniformTabWidth={false}
    on:tabSelected={handleTabSelected}
  >
    <div slot="tab" let:tab class="tab-header-container">
      <span>{tab.label}</span>
      {#if tab.count !== undefined}
        <span class="count">{tab.count}</span>
      {/if}
    </div>
    {#if activeTab?.id === 'overview'}
      <div class="tab-container">
        <SchemaOverview
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
          <SchemaTables {tablesMap} {database} {schema} />
        {/if}
      </div>
    {:else if activeTab?.id === 'explorations'}
      <div class="tab-container">
        {#if isExplorationsLoading}
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
  }

  .tab-header-container {
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.25rem;
    }

    .count {
      border-radius: var(--border-radius-l);
      background: var(--slate-100);
      padding: 0.071rem 0.14rem;
    }
  }
</style>
