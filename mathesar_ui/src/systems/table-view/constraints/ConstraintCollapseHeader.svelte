<script lang="ts">
  import type { Constraint } from '@mathesar/api/types/tables/constraints';
  import { Button, Icon } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  export let constraint: Constraint;

  const tabularData = getTabularDataStoreFromContext();

  $: columnsInTable = $tabularData.columnsDataStore.columns;
  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: columnsInConstraint = $columnsInTable.filter((c) =>
    constraint.columns.includes(c.id),
  );

  function handleDrop() {
    void confirmDelete({
      identifierType: 'Constraint',
      identifierName: constraint.name,
      body: ['Are you sure you want to proceed?'],
      onProceed: () => constraintsDataStore.remove(constraint.id),
    });
  }
</script>

<div class="column-names-header">
  <div class="column-names">
    {#each columnsInConstraint as column (column.id)}
      <span class="column-name-container">
        <ColumnName {column} />
      </span>
    {/each}
  </div>
  {#if constraint.type !== 'primary'}
    <Button on:click={handleDrop} size="small" appearance="plain">
      <Icon {...iconDeleteMajor} />
    </Button>
  {/if}
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

    > :global(* + *) {
      margin-left: 0.25rem;
    }
  }

  .column-name-container {
    font-size: var(--text-size-small);
    background-color: var(--slate-200);
    border-radius: var(--border-radius-xl);
    padding: 0.285rem 0.428rem;
  }
</style>
