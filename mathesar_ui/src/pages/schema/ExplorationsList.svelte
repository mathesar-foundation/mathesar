<script lang="ts">
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { modal } from '@mathesar/stores/modal';

  import EditExplorationModal from './EditExplorationModal.svelte';
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
  {/each}
</div>

{#if explorationForEditing}
  <EditExplorationModal
    controller={editExplorationModal}
    exploration={explorationForEditing}
  />
{/if}
