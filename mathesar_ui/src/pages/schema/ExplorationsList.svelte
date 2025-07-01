<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { modal } from '@mathesar/stores/modal';

  import EditExplorationModal from './EditExplorationModal.svelte';
  import EmptyEntityList from './EmptyEntityList.svelte';
  import ExplorationItem from './ExplorationItem.svelte';

  const editExplorationModal = modal.spawnModalController();

  export let explorations: SavedExploration[];
  export let database: Database;
  export let schema: Schema;

  let explorationForEditing: SavedExploration | undefined;

  function openEditExplorationModal(exploration: SavedExploration) {
    explorationForEditing = exploration;
    editExplorationModal.open();
  }
</script>

<div class="exploration-list">
  {#each explorations as exploration (exploration.id)}
    <ExplorationItem
      {exploration}
      {database}
      {schema}
      {openEditExplorationModal}
    />
  {:else}
    <EmptyEntityList icon={iconExploration} text={$_('no_explorations')} />
  {/each}
</div>

{#if explorationForEditing}
  <EditExplorationModal
    controller={editExplorationModal}
    exploration={explorationForEditing}
  />
{/if}
