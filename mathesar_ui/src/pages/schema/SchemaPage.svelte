<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Database } from '@mathesar/AppTypes';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconEdit, iconManageAccess, iconSchema } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getSchemaPageExplorationsSectionUrl,
    getSchemaPageTablesSectionUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import {
    importVerifiedTables as importVerifiedTablesStore,
    currentTablesData as tablesStore,
  } from '@mathesar/stores/tables';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { logEvent } from '@mathesar/utils/telemetry';
  import { Button, Icon, TabContainer } from '@mathesar-component-library';

  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';

  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import SchemaAccessControlModal from './SchemaAccessControlModal.svelte';
  import SchemaExplorations from './SchemaExplorations.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaTables from './SchemaTables.svelte';
  import TableSkeleton from './TableSkeleton.svelte';

  export let database: Database;
  export let schema: Schema;
  export let section: string;

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: canExecuteDDL =
    userProfile?.hasPermission({ database, schema }, 'canExecuteDDL') ?? false;
  $: canEditMetadata =
    userProfile?.hasPermission({ database, schema }, 'canEditMetadata') ??
    false;
  $: canEditPermissions = userProfile?.hasPermission(
    { database, schema },
    'canEditPermissions',
  );

  const addEditModal = modal.spawnModalController();
  const accessControlModal = modal.spawnModalController();

  // NOTE: This has to be same as the name key in the paths prop of Route component
  type TabsKey = 'overview' | 'tables' | 'explorations';
  type TabItem = {
    label: string;
    id: TabsKey;
    count?: number;
    href: string;
  };

  $: tablesMap = canExecuteDDL
    ? $tablesStore.tablesMap
    : $importVerifiedTablesStore;
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

  function manageAccess() {
    accessControlModal.open();
  }

  logEvent('opened_schema', {
    database_name: database.nickname,
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
      {#if !isDefault && canExecuteDDL}
        <Button on:click={handleEditSchema} appearance="secondary">
          <Icon {...iconEdit} />
          <span>{$_('edit_schema')}</span>
        </Button>
      {/if}
      {#if canEditPermissions}
        <Button on:click={manageAccess} appearance="secondary">
          <Icon {...iconManageAccess} />
          <span>{$_('manage_access')}</span>
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
          {canExecuteDDL}
          {canEditMetadata}
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
          <SchemaTables {canExecuteDDL} {tablesMap} {database} {schema} />
        {/if}
      </div>
    {:else if activeTab?.id === 'explorations'}
      <div class="tab-container">
        {#if explorationsRequestStatus.state === 'processing'}
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
<SchemaAccessControlModal controller={accessControlModal} {database} {schema} />

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
