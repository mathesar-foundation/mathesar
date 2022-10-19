<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { queries } from '@mathesar/stores/queries';
  import { tables as tablesStore } from '@mathesar/stores/tables';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import LayoutWithHeader2 from '@mathesar/layouts/LayoutWithHeader2.svelte';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import { iconSchema, iconEdit } from '@mathesar/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { modal } from '@mathesar/stores/modal';
  import TabContainer from '@mathesar/component-library/tabs/TabContainer.svelte';
  import AddEditSchemaModal from '../database/AddEditSchemaModal.svelte';
  import SchemOverview from './SchemOverview.svelte';
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
  type TabItem = { label: string; id: TabsKey };
  const tabs: TabItem[] = [
    {
      label: 'Overview',
      id: 'overview',
    },
    {
      label: 'Tables',
      id: 'tables',
    },
    {
      label: 'Explorations',
      id: 'explorations',
    },
  ];
  let activeTab: TabItem;
  $: tablesMap = $tablesStore.data;
  $: explorationsMap = $queries.data;

  function handleEditSchema() {
    addEditModal.open();
  }
</script>

<svelte:head><title>{makeSimplePageTitle(schema.name)}</title></svelte:head>

<LayoutWithHeader2 --max-layout-width="64rem">
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

  <TabContainer bind:activeTab {tabs}>
    <slot>
      {#if activeTab?.id === 'overview'}
        <div class="tab-container">
          <SchemOverview {tablesMap} {explorationsMap} {database} {schema} />
        </div>
      {:else if activeTab?.id === 'tables'}
        <div class="tab-container">
          <SchemaTables {tablesMap} {database} {schema} />
        </div>
      {:else}
        <div class="tab-container">
          <SchemaExplorations {explorationsMap} {database} {schema} />
        </div>
      {/if}
    </slot>
  </TabContainer>
</LayoutWithHeader2>

<AddEditSchemaModal controller={addEditModal} {database} {schema} />

<style lang="scss">
  .tab-container {
    padding-top: 1rem;
  }
</style>
