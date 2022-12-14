<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Constraint } from '@mathesar/stores/table-data';
  import { tables } from '@mathesar/stores/tables';
  import type { PaginatedResponse } from '@mathesar/api/utils/requestUtils';
  import { getAPI } from '@mathesar/api/utils/requestUtils';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { Icon, iconError, Spinner } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';

  export let constraint: Constraint;

  $: referentTable =
    constraint.type === 'foreignkey'
      ? $tables.data.get(constraint.referent_table)
      : undefined;

  async function getReferentColumns(_constraint: Constraint) {
    if (_constraint.type !== 'foreignkey') {
      return [];
    }
    const tableId = _constraint.referent_table;
    const url = `/api/db/v0/tables/${tableId}/columns/?limit=500`;
    const referentTableColumns = await getAPI<PaginatedResponse<Column>>(url);
    return referentTableColumns.results.filter((c) =>
      _constraint.referent_columns.includes(c.id),
    );
  }
</script>

<div class="constraint-details">
  <div>
    <span>Constraint Name:</span>
    <span>{constraint.name}</span>
  </div>
  {#if referentTable}
    <div class="target">
      <span>Target:</span>
      <div class="target-details">
        <span class="entity-name-container">
          <TableName table={referentTable} />
        </span>
        {#await getReferentColumns(constraint)}
          <Spinner />
        {:then referentColumns}
          {#each referentColumns as referentColumn, index (referentColumn.id)}
            <span class="entity-name-container">
              <ColumnName column={referentColumn} />
            </span>
          {/each}
        {:catch error}
          <Icon {...iconError} />
        {/await}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .constraint-details {
    display: flex;
    flex-direction: column;

    font-size: var(--text-size-small);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .entity-name-container {
    font-size: var(--text-size-small);
    background-color: var(--slate-200);
    border-radius: var(--border-radius-xl);
    padding: 4px 6px;
  }

  .target {
    display: flex;
    align-items: center;
    padding-bottom: 0.5rem;

    > :global(* + *) {
      margin-left: 0.25rem;
    }
  }

  .target-details {
    display: flex;

    > :global(* + *) {
      margin-left: 0.25rem;
    }
  }
</style>
