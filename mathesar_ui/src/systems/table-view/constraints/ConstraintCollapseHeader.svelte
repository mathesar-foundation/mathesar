<script lang="ts">
  import type { Constraint } from '@mathesar/api/types/tables/constraints';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  export let constraint: Constraint;

  const tabularData = getTabularDataStoreFromContext();

  $: columnsInTable = $tabularData.columnsDataStore.columns;
  $: columnsInConstraint = $columnsInTable.filter((c) =>
    constraint.columns.includes(c.id),
  );
</script>

<div class="column-names-header">
  <div class="column-names">
    {#each columnsInConstraint as column (column.id)}
      <span class="column-name-container">
        <ColumnName {column} />
      </span>
    {/each}
  </div>
</div>

<style lang="scss">
  .column-names-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .column-names {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: calc(var(--size-super-ultra-small) * -1);
    > :global(* + *) {
      margin-left: 0.25rem;
    }
  }

  .column-name-container {
    font-size: var(--text-size-small);
    background-color: var(--slate-200);
    border-radius: var(--border-radius-xl);
    padding: 0.285rem 0.428rem;
    margin-bottom: var(--size-super-ultra-small);
  }
</style>
