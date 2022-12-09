<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';
  import EmptyEntity from './EmptyEntity.svelte';
  import TableItem from './TableItem.svelte';

  export let tables: TableEntry[];
  export let database: Database;
  export let schema: SchemaEntry;
</script>

<div class="container">
  {#each tables as table (table.id)}
    <TableItem {table} {database} {schema} />
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
  }
  @supports (width: min(var(--minimum-item-width), 100%)) {
    .container {
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(var(--minimum-item-width), 100%), 1fr)
      );
    }
  }
</style>
