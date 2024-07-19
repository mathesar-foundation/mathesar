<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Table } from '@mathesar/api/rpc/tables';
  import type { Database } from '@mathesar/AppTypes';
  import { iconTable } from '@mathesar/icons';

  import EmptyEntity from './EmptyEntity.svelte';
  import TableCard from './TableCard.svelte';

  export let tables: Table[];
  export let database: Database;
  export let schema: Schema;
  export let canExecuteDDL: boolean;
</script>

<div class="container">
  {#each tables as table (table.oid)}
    <TableCard {canExecuteDDL} {table} {database} {schema} />
  {:else}
    <EmptyEntity icon={iconTable}>
      <p>{$_('no_tables')}</p>
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
