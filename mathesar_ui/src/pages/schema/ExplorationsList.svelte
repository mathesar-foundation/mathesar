<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconExploration } from '@mathesar/icons';
  import ExplorationItem from './ExplorationItem.svelte';
  import EmptyEntity from './EmptyEntity.svelte';

  export let explorations: QueryInstance[];
  export let database: Database;
  export let schema: SchemaEntry;
  export let bordered = true;
</script>

<div class="container" class:bordered={explorations.length > 0 && bordered}>
  {#each explorations as exploration, index (exploration.id)}
    <ExplorationItem {exploration} {database} {schema} />
    {#if index !== explorations.length - 1}
      <div class="divider" />
    {/if}
  {:else}
    <EmptyEntity icon={iconExploration}>
      <p>No Explorations</p>
    </EmptyEntity>
  {/each}
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;

    &.bordered {
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-l);
    }
  }

  .divider {
    border-bottom: 1px solid var(--slate-200);
  }
</style>
