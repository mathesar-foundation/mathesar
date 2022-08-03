<script lang="ts">
  import { Icon, Button, Spinner } from '@mathesar-component-library';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Constraint } from '@mathesar/api/tables/constraints';
  import { tables } from '@mathesar/stores/tables';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import type { Column } from '@mathesar/api/tables/columns';
  import type { PaginatedResponse } from '@mathesar/utils/api';
  import { getAPI } from '@mathesar/utils/api';
  import { iconAdd, iconDelete, iconForward, iconWarningTriangle } from '@mathesar/icons';

  export let constraint: Constraint;
  export let drop: () => Promise<void>;

  const tabularData = getTabularDataStoreFromContext();

  function handleDrop() {
    void confirmDelete({
      identifierType: 'Constraint',
      identifierName: constraint.name,
      body: ['Are you sure you want to proceed?'],
      onProceed: drop,
    });
  }

  $: dropTitle = `Delete constraint '${constraint.name}'`;
  $: columns = $tabularData.columnsDataStore.getColumnsByIds(
    constraint.columns,
  );
  $: columnNames = columns.map((columnInConstraint) => columnInConstraint.name);
  $: columnSummary = columnNames.join(', ');
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

<div class="table-constraint">
  <div>
    <div><span class="name">{constraint.name}</span></div>
    <div>
      <span class="type">{constraint.type}</span>
      <span>&bull;</span>
      <span class="columns">{columnSummary}</span>
    </div>
    <div class="referent">
      {#if referentTable}
        References
        <Identifier>{referentTable.name}</Identifier>
        <Icon {...iconForward} />
        {#await getReferentColumns(constraint)}
          <Spinner />
        {:then referentColumns}
          {#each referentColumns as referentColumn, index (referentColumn.id)}
            <Identifier>{referentColumn.name}</Identifier>
            {#if index < referentColumns.length - 1}
              <Icon {...iconAdd} />
            {/if}
          {/each}
        {:catch error}
          <Icon {...iconWarningTriangle} />
        {/await}
      {/if}
    </div>
  </div>
  <div class="drop">
    <Button on:click={handleDrop} title={dropTitle}>
      <Icon {...iconDelete} />
    </Button>
  </div>
</div>

<style>
  .table-constraint {
    line-height: 1.4;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .type {
    text-transform: uppercase;
    color: #666;
  }
  .drop {
    color: #f47171;
  }
  .columns {
    color: #666;
    font-size: 0.9rem;
  }
  .referent {
    color: #666;
  }
</style>
