<script lang="ts">
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { constructTabularTabLink } from '@mathesar/stores/tabs/tabDataSaver';
  import { getTabsForSchema } from '@mathesar/stores/tabs';
  import { TabularType } from '@mathesar/stores/table-data';
  import type { TableEntry } from '@mathesar/AppTypes';

  import DataScape from './routes/datascape/Datascape.svelte';
  import EmptyState from './EmptyState.svelte';
  import LeftPane from './LeftPane.svelte';

  export let database: string;
  export let schemaId: number;

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

  function getLeftPaneLink(entry: TableEntry) {
    return constructTabularTabLink(
      database,
      schemaId,
      TabularType.Table,
      entry.id,
    );
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

<section class="workarea">
  {#if $tabs?.length > 0}
    <DataScape {database} {schemaId} />
  {:else}
    <EmptyState />
  {/if}
</section>

<style global lang="scss">
  section.workarea {
    position: absolute;
    top: 0;
    left: var(--side-bar-width);
    right: 0;
    bottom: 0;
    overflow: auto;
    background: #f6f7fdaa;
  }
</style>
