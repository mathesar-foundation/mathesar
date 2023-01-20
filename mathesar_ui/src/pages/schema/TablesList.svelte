<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';
  import EmptyEntity from './EmptyEntity.svelte';
  import TableCard from './TableCard.svelte';

  export let tables: TableEntry[];
  export let database: Database;
  export let schema: SchemaEntry;
</script>

<div class="container">
  {#each tables as table (table.id)}
    <TableCard {table} {database} {schema} />
  {:else}
    <EmptyEntity icon={iconTable}>
      <p>No Tables</p>
    </EmptyEntity>
  {/each}
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-gap: 1rem;
    --minimum-item-width: 18rem;
    // align all child items to the left
  }
  @supports (width: min(var(--minimum-item-width), 100%)) {
    .container {
      grid-template-columns: repeat(
        auto-fill,
        minmax(var(--minimum-item-width), 1fr)
      );
    }
  }
</style>
