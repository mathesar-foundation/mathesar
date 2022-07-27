<script lang="ts">
  import { Route } from 'tinro';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { getTabsForSchema } from '@mathesar/stores/tabs';

  import DataScape from './routes/datascape/Datascape.svelte';
  import DataExplorer from './routes/data-explorer/DataExplorer.svelte';

  export let database: string;
  export let schemaId: number;

  $: tabList = getTabsForSchema(database, schemaId);
  $: ({ activeTab } = tabList);

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
</script>

<svelte:head>
  <title>Mathesar - {$activeTab?.label || 'Home'}</title>
</svelte:head>

<section class="workarea">
  <!-- TODO: Discuss if we should keep all route information in one place. Eg., only in App.svelte -->
  <Route path="/">
    <DataScape {database} {schemaId} />
  </Route>
  <Route path="/queries/*" firstmatch>
    <DataExplorer {database} {schemaId} />
  </Route>
</section>

<style global lang="scss">
  section.workarea {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
  }
</style>
