<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    TabContainer,
    Icon,
  } from '@mathesar-component-library';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    getTabsForSchema,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab, TabList } from '@mathesar/stores/tabs/types';

  import ImportData from './import-data/ImportData.svelte';
  import TableView from './table-view/TableView.svelte';
  import EmptyState from './empty-state/EmptyState.svelte';
  import LeftPane from './left-pane/LeftPane.svelte';

  export let database : string;
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

  function getLink(entry: MathesarTab) {
    if (entry.isNew) {
      return null;
    }
    return `/${database}/${schemaId}/${URLQueryHandler.constructTableLink(entry.tabularData.id)}`;
  }

  function tabSelected(e: { detail: { tab: MathesarTab, originalEvent: Event } }) {
    const { originalEvent, tab } = e.detail;
    originalEvent.preventDefault();
    // selectTab(database, tab);
  }

  function tabRemoved(e: { detail: { removedTab: MathesarTab } }) {
    tabList.remove(e.detail.removedTab);
  }
</script>

<svelte:head>
  <title>Mathesar - {$activeTab?.label || 'Home'}</title>
</svelte:head>

<LeftPane {getLink} {database} {schemaId} activeTab={$activeTab}/>

<section class="table-section">
  {#if $tabs?.length > 0}
    <TabContainer bind:tabs={$tabs} bind:activeTab={$activeTab}
                  allowRemoval={true} preventDefault={true} {getLink}
                  on:tabSelected={tabSelected} on:tabRemoved={tabRemoved}>
      <span slot="tab" let:tab>
        <Icon data={faTable}/>
        <span>{tab.label}</span>
      </span>

      {#if $activeTab}
        {#if $activeTab.isNew}
          <ImportData {database} {schemaId} id={$activeTab.id}/>
        {:else}
          <TableView {database} id={$activeTab.id}/>
        {/if}
      {/if}
    </TabContainer>

  {:else}
    <EmptyState/>
  {/if}
</section>

<style global lang="scss">
  @import "Base.scss";
</style>
