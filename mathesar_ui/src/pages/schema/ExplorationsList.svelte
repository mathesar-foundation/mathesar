<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import { iconExploration } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';

  import EmptyEntityList from './EmptyEntityList.svelte';
  import ExplorationItem from './ExplorationItem.svelte';

  export let explorations: SavedExploration[];
  export let database: Database;
  export let schema: Schema;
</script>

<div class="exploration-list">
  {#each explorations as exploration (exploration.id)}
    <ExplorationItem {exploration} {database} {schema} />
  {:else}
    <EmptyEntityList icon={iconExploration} text={$_('no_explorations')} />
  {/each}
</div>
