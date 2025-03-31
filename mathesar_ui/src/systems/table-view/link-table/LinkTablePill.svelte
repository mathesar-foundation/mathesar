<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';

  export let table: Pick<Table, 'name'>;
  export let which: 'base' | 'target' | 'mapping';
</script>

<span
  class="table-pill"
  class:base={which === 'base'}
  class:target={which === 'target'}
  class:mapping={which === 'mapping'}
>
  <TableName {table} />
</span>

<style>
  .table-pill {
    border-radius: 4px;
    padding: 0.25em 0.5em;
    margin: 0 0.25em;
    display: inline-flex;
    align-items: center;
    font-size: 0.9em;
    line-height: 1.2;
    color: var(--text-color-primary);
    font-weight: var(--font-weight-semibold);
  }

  .base {
    background: var(--base-fill);
    border: 1px solid var(--base-stroke);
  }

  .target {
    background: var(--target-fill);
    border: 1px solid var(--target-stroke);
  }

  .mapping {
    background: var(--mapping-fill);
    border: 1px solid var(--mapping-stroke);
  }

  @media (prefers-color-scheme: dark) {
    .table-pill {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }
</style>
