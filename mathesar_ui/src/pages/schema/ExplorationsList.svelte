<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';

  import EmptyEntity from './EmptyEntity.svelte';
  import ExplorationItem from './ExplorationItem.svelte';

  export let explorations: SavedExploration[];
  export let database: Database;
  export let schema: Schema;
</script>

<div class="container">
  {#each explorations as exploration, index (exploration.id)}
    <ExplorationItem {exploration} {database} {schema} />
  {:else}
    <EmptyEntity icon={iconExploration}>
      <p>{$_('no_explorations')}</p>
    </EmptyEntity>
  {/each}
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
