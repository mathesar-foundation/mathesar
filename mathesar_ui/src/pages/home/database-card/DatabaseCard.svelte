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
    box-shadow: var(--card-shadow);
    transition: background 120ms ease, box-shadow 120ms ease;
  }

  .db-card.hoverable {
    cursor: pointer;
  }

  .db-card.hoverable:hover {
    border: 1px solid color-mix(in srgb, var(--SYS-accent-tomato-brighter), transparent 70%);
    box-shadow: 0 1px 2px 0 color-mix(in srgb, var(--SYS-accent-tomato-brighter), transparent 80%);
    background: color-mix(in srgb, var(--SYS-accent-tomato-faint), transparent 78%);
  }

  .db-card.hoverable:focus {
    outline: 2px solid var(--SYS-accent-salmon-base);
    outline-offset: 1px;
  }

  .db-card.hoverable:active {
    border: 1px solid color-mix(in srgb, var(--SYS-accent-tomato-faint), transparent 90%);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--SYS-accent-tomato-bright), transparent 60%);
    background: color-mix(in srgb, var(--SYS-accent-tomato-faint), transparent 85%);
  }
</style>
