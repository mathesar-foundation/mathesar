<script lang="ts">
  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';

  import DatabaseCardContent from './DatabaseCardContent.svelte';
  import DatabaseCardNeedsUpdate from './DatabaseCardNeedsUpdate.svelte';

  export let database: Database;
  export let onTriggerUpgrade: (database: Database) => void;

  $: needsUpgrade = database.needsUpgradeAttention;
  $: href = getDatabasePageUrl(database.id);
</script>

<div class="db-card" class:hoverable={!needsUpgrade}>
  {#if database.needsUpgradeAttention}
    <DatabaseCardNeedsUpdate {database} {onTriggerUpgrade} />
  {:else}
    <a class="db-card-link passthrough" {href}>
      <DatabaseCardContent {database} />
    </a>
  {/if}
</div>

<style lang="scss">
  .db-card {
    border-radius: var(--border-radius-l);
    border: 1px solid var(--card-border-color);
    background-color: var(--card-background);
    overflow: hidden;
    box-shadow: 0 1px 2px 0
      color-mix(in srgb, var(--color-shadow), transparent 80%);
    transition:
      background 120ms ease,
      box-shadow 120ms ease;
  }

  .db-card.hoverable {
    cursor: pointer;
    outline-offset: 1px;

    &:has(.db-card-link:hover) {
      border: 1px solid var(--color-database-15);
      background: var(--color-database-10-active);
      box-shadow: var(--card-hover-box-shadow);
    }

    &:has(.db-card-link:focus) {
      outline: 2px solid var(--color-database-40);
      border: 1px solid var(--color-database-40);
      box-shadow: var(--card-focus-box-shadow);
    }

    &:has(.db-card-link:active) {
      outline: 2px solid var(--color-database-40);
      border: 1px solid var(--color-database-40);
      background: var(--color-database-15-active);
      box-shadow: 0 1px 2px 0 var(--color-database-20-active);
    }
  }
</style>
