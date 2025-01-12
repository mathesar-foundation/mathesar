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
    border: 1px solid var(--slate-200);
    background-color: var(--white);
    overflow: hidden;
  }
  .db-card.hoverable {
    cursor: pointer;
  }
  .db-card.hoverable:hover {
    border-color: var(--slate-500);
    background-color: var(--slate-50);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }
</style>
