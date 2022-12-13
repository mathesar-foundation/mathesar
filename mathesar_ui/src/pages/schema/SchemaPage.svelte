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
  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';
  import SchemaOverview from './SchemaOverview.svelte';
  import SchemaTables from './SchemaTables.svelte';
  import SchemaExplorations from './SchemaExplorations.svelte';

  export let database: Database;
  export let schema: SchemaEntry;

  /**
   * This property will be used for the latest design changes
   * Based on the subroute, the desired tab/section will be selected
   * Make this a variable and pass value to it from SchemaRoute.svelte
   *
   * The eslint warning is in place because SchemaRoute will throw
   * ts errors without it. We can remove it once we actually use the
   * variable.
   */
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  export const section: string = 'overview';

  const addEditModal = modal.spawnModalController();

  type TabsKey = 'overview' | 'tables' | 'explorations';
  type TabItem = { label: string; id: TabsKey; count?: number };

  let activeTab: TabItem;
  $: tablesMap = $tablesStore.data;
  $: explorationsMap = $queries.data;

  $: tabs = [
    {
      label: 'Overview',
      id: 'overview',
    },
    {
      label: 'Tables',
      id: 'tables',
      count: tablesMap.size,
    },
    {
      label: 'Explorations',
      id: 'explorations',
      count: explorationsMap.size,
    },
  ];

  function handleEditSchema() {
    addEditModal.open();
  }
</script>

<svelte:head><title>{makeSimplePageTitle(schema.name)}</title></svelte:head>

<LayoutWithHeader
  restrictWidth={true}
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

  <TabContainer bind:activeTab {tabs} uniformTabWidth={false}>
    <div slot="tab" let:tab class="tab-header-container">
      <span>{tab.label}</span>
      {#if tab.count !== undefined}
        <span class="count">{tab.count}</span>
      {/if}
    </div>
    {#if activeTab?.id === 'overview'}
      <div class="tab-container">
        <SchemaOverview {tablesMap} {explorationsMap} {database} {schema} />
      </div>
    {:else if activeTab?.id === 'tables'}
      <div class="tab-container">
        <SchemaTables {tablesMap} {database} {schema} />
      </div>
    {:else if activeTab?.id === 'explorations'}
      <div class="tab-container">
        <SchemaExplorations
          hasTablesToExplore={!!tablesMap.size}
          {explorationsMap}
          {database}
          {schema}
        />
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
