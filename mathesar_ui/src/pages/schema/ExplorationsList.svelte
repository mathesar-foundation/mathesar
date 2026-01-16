<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

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

  function getExplorationDuplicateName(exploration: SavedExploration) {
    const duplicateName = get(_)('exploration_duplicate_name', {
      values: { explorationName: exploration.name },
    });

    const existingDuplicates = explorations.filter((e) =>
      e.name.startsWith(duplicateName),
    );
    if (existingDuplicates.length === 0) return duplicateName;

    // Find bracketed number at end of string
    const suffixRegex = /\((\d+)\)$/;
    const suffixNumbers = existingDuplicates
      .map((duplicate) => {
        const match = duplicate.name.match(suffixRegex);
        return match ? Number(match[1]) : null;
      })
      .filter((n): n is number => n !== null);
    const maxSuffix = suffixNumbers.length > 0 ? Math.max(...suffixNumbers) : 0;

    return `${duplicateName} (${maxSuffix + 1})`;
  }
</script>

<div class="exploration-list">
  {#each explorations as exploration (exploration.id)}
    <ExplorationItem
      {exploration}
      {database}
      {schema}
      {openEditExplorationModal}
      {getExplorationDuplicateName}
    />
  {/each}
</div>

{#if explorationForEditing}
  <EditExplorationModal
    controller={editExplorationModal}
    exploration={explorationForEditing}
  />
{/if}
