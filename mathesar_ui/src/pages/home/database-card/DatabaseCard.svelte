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
    border: 1px solid var(--border-card);
    background-color: var(--surface-card);
    overflow: hidden;
    box-shadow: 0 1px 2px 0
      color-mix(in srgb, var(--border-shadow), transparent 80%);
    transition:
      background 120ms ease,
      box-shadow 120ms ease;
  }

  .db-card.hoverable {
    cursor: pointer;
  }

  .db-card.hoverable:hover {
    border: 1px solid var(--color-database-15);
    box-shadow: 0 1px 2px 0 var(--color-database-hover-15);
    background: var(--color-database-active-10);
  }

  .db-card.hoverable:focus {
    outline: 2px solid var(--color-database-20);
    outline-offset: 1px;
  }

  .db-card.hoverable:active {
    border: 1px solid var(--color-database-20);
    box-shadow: 0 1px 2px 0 var(--color-database-active-20);
    background: var(--color-database-active-15);
  }
</style>
