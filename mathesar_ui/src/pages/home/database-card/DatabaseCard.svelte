<script lang="ts">
  import type { Database } from '@mathesar/models/Database';

  import DatabaseCardNeedsUpdate from './DatabaseCardNeedsUpdate.svelte';
  import DatabaseCardUpToDate from './DatabaseCardUpToDate.svelte';

  export let database: Database;
  export let onTriggerUpgrade: (database: Database) => void;

  $: needsUpgrade = database.needsUpgradeAttention;
</script>

<div class="db-card" class:hoverable={!needsUpgrade}>
  {#if database.needsUpgradeAttention}
    <DatabaseCardNeedsUpdate {database} {onTriggerUpgrade} />
  {:else}
    <DatabaseCardUpToDate {database} />
  {/if}
</div>

<style lang="scss">
  .db-card {
    border-radius: var(--border-radius-l);
    border: 1px solid var(--card-border);
    background-color: var(--card-background);
    overflow: hidden;
    box-shadow: var(--card-active-shadow);
    transition: background-color 0.2s ease-in-out;
  }

  .db-card.hoverable {
    cursor: pointer;
  }

  .db-card.hoverable:hover {
    border: 1px solid var(--card-hover-border);
    box-shadow: var(--card-hover-shadow);
    background-color: var(--card-background);
  }

  .db-card.hoverable:focus {
    outline: 2px solid var(--sand-400);
    outline-offset: 1px;
  }

  .db-card.hoverable:active {
    border-color: var(--stormy-400);
    box-shadow: var(--card-active-shadow);
    transform: translateY(0);
    background-color: var(--card-background);
  }
</style>
