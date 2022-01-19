<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import { TabContainer, Icon } from '@mathesar-component-library';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    getTabsForSchema,
    constructTabularTabLink,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab, TabList } from '@mathesar/stores/tabs/types';
  import { TabularType } from '@mathesar/App.d';
  import type { TableEntry } from '@mathesar/App.d';

  import ImportData from './import-data/ImportData.svelte';
  import TableView from './table-view/TableView.svelte';
  import EmptyState from './empty-state/EmptyState.svelte';
  import LeftPane from './left-pane/LeftPane.svelte';

  export let database: string;
  export let schemaId: number;

  let tabList: TabList;
  $: tabList = getTabsForSchema(database, schemaId);
  $: ({ tabs, activeTab } = tabList);

  function changeCurrentSchema(_database: string, _schemaId: number) {
    if ($currentDBName !== _database) {
      $currentDBName = _database;
    }
    if ($currentSchemaId !== _schemaId) {
      $currentSchemaId = _schemaId;
    }
  }

  // TODO: Move this entire logic to data layer without involving view layer
  $: changeCurrentSchema(database, schemaId);

  function getTabLink(entry: MathesarTab): string | undefined {
    if (entry.isNew || !entry.tabularData) {
      return undefined;
    }
    return constructTabularTabLink(
      database,
      schemaId,
      entry.tabularData.type,
      entry.tabularData.id,
    );
  }

  function getLeftPaneLink(entry: TableEntry) {
    return constructTabularTabLink(
      database,
      schemaId,
      TabularType.Table,
      entry.id,
    );
  }

  function tabRemoved(e: { detail: { removedTab: MathesarTab } }) {
    tabList.remove(e.detail.removedTab);
  }
</script>

<svelte:head>
  <title>Mathesar - {$activeTab?.label || 'Home'}</title>
</svelte:head>

<LeftPane
  getLink={getLeftPaneLink}
  {database}
  {schemaId}
  activeTab={$activeTab}
/>

<section class="table-section">
  {#if $tabs?.length > 0}
    <TabContainer
      bind:tabs={$tabs}
      bind:activeTab={$activeTab}
      allowRemoval={true}
      preventDefault={true}
      getLink={getTabLink}
      on:tabRemoved={tabRemoved}
    >
      <span slot="tab" let:tab>
        <Icon data={faTable} />
        <span>{tab.label}</span>
      </span>

      {#if $activeTab}
        {#if $activeTab.isNew}
          <ImportData {database} {schemaId} id={$activeTab.fileImportId} />
        {:else if $activeTab.tabularData}
          <TableView tabularData={$activeTab.tabularData} />
        {/if}
      {/if}
    </TabContainer>
  {:else}
    <EmptyState />
  {/if}
</section>

<style global lang="scss">
  @import 'Base.scss';
</style>
