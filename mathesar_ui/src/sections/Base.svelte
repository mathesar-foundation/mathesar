<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    TabContainer,
    Icon,
  } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId, currentSchema } from '@mathesar/stores/schemas';
  import {
    getTabsForSchema,
    removeTab,
    selectTab,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab } from '@mathesar/stores/tabs';
  import type { Writable } from 'svelte/store';

  import ImportData from './import-data/ImportData.svelte';
  import TableView from './table-view/TableView.svelte';
  import EmptyState from './empty-state/EmptyState.svelte';
  import LeftPane from './left-pane/LeftPane.svelte';

  export let database : string;
  export let schemaId: number;

  let tabs: Writable<MathesarTab[]>;
  let activeTab: Writable<MathesarTab>;

  function changeCurrentSchema(_database: string, _schemaId: number) {
    let isChanged = false;
    if ($currentDBName !== _database) {
      $currentDBName = _database;
      isChanged = true;
    }
    if ($currentSchemaId !== _schemaId) {
      $currentSchemaId = _schemaId;
      isChanged = true;
    }

    if (isChanged || !tabs) {
      ({ tabs, activeTab } = getTabsForSchema($currentDBName, $currentSchemaId));
      // Sync tabs to url here!
    }
  }

  $: changeCurrentSchema(database, schemaId);

  function getLink(entry: MathesarTab) {
    if (entry.isNew) {
      return null;
    }
    return `/${database}/${schemaId}/${URLQueryHandler.constructTableLink(entry.id as number)}`;
  }

  function tabSelected(e: { detail: { tab: MathesarTab, originalEvent: Event } }) {
    const { originalEvent, tab } = e.detail;
    originalEvent.preventDefault();

    selectTab(database, tab);
  }

  function tabRemoved(e: { detail: { removedTab: MathesarTab } }) {
    removeTab(database, schemaId, e.detail.removedTab);
  }
</script>

<svelte:head>
  <title>Mathesar - {$activeTab?.label || 'Home'}</title>
</svelte:head>

{#if $currentSchema}
  <LeftPane {getLink} {database} schema={$currentSchema} activeTab={$activeTab}/>
{/if}

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
          <ImportData {database} schemaId={$currentSchemaId} id={$activeTab.id}/>
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
