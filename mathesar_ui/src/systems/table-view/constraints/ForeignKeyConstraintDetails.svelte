<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { RawConstraint } from '@mathesar/api/rpc/constraints';
  import { Icon, Spinner, iconError } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Database } from '@mathesar/models/Database';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';

  export let database: Database;
  export let constraint: RawConstraint;

  $: referentTableOid =
    constraint.type === 'foreignkey'
      ? constraint.referent_table_oid
      : undefined;

  const tableFetch = new AsyncStore(getTableFromStoreOrApi);
  $: referentTableOid
    ? void tableFetch.run({ database, tableOid: referentTableOid })
    : tableFetch.reset();
  $: referentTable = $tableFetch.resolvedValue;

  async function getReferentColumns(_constraint: RawConstraint) {
    if (_constraint.type !== 'foreignkey') {
      return [];
    }
    const referentTableColumns = await api.columns
      .list_with_metadata({
        database_id: database.id,
        table_oid: _constraint.referent_table_oid,
      })
      .run();
    return referentTableColumns.filter((c) =>
      _constraint.referent_columns.includes(c.id),
    );
  }
</script>

<div class="constraint-details">
  <div>
    <span>{$_('constraint_name')}:</span>
    <span>{constraint.name}</span>
  </div>
  {#if referentTable}
    <div class="target">
      <span>{$_('target')}:</span>
      <div class="target-details">
        <span class="entity-name-container">
          <TableName table={referentTable} />
        </span>
        {#await getReferentColumns(constraint)}
          <Spinner />
        {:then referentColumns}
          {#each referentColumns as referentColumn (referentColumn.id)}
            <span class="entity-name-container">
              <ColumnName column={referentColumn} />
            </span>
          {/each}
        {:catch}
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

    font-size: var(--sm1);

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .entity-name-container {
    font-size: var(--sm1);
    background-color: var(--color-bg-raised-2);
    border-radius: var(--border-radius-xl);
    padding: 0.285rem 0.428rem;
    font-weight: var(--font-weight-bold);
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
    align-items: center;

    > :global(* + *) {
      margin-left: 0.25rem;
    }
  }
</style>
