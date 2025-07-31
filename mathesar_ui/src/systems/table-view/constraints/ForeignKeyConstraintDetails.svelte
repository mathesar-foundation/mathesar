<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { RawConstraint } from '@mathesar/api/rpc/constraints';
  import { Icon, Spinner, iconError } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { databasesStore } from '@mathesar/stores/databases';
  import { currentTablesData } from '@mathesar/stores/tables';

  export let constraint: RawConstraint;

  $: referentTable =
    constraint.type === 'foreignkey'
      ? $currentTablesData.tablesMap.get(constraint.referent_table_oid)
      : undefined;

  async function getReferentColumns(_constraint: RawConstraint) {
    if (_constraint.type !== 'foreignkey') {
      return [];
    }
    const database = get(databasesStore.currentDatabase);
    if (!database) {
      throw new Error('Current database not set');
    }
    const referentTableColumns = await api.columns
      .list({
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
    background-color: var(--neutral-200);
    border-radius: var(--border-radius-xl);
    padding: 0.285rem 0.428rem;
    font-weight: var(--font-weight-bold);

    :global(body.theme-dark) & {
      background-color: var(--stormy-800);
      border: 1px solid var(--stormy-600);
      color: var(--text-color-secondary);
    }
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
