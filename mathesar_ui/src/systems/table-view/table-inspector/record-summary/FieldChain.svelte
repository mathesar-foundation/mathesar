<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { defined } from '@mathesar/component-library';
  import FieldDelimiter from '@mathesar/components/FieldDelimiter.svelte';
  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import type { Database } from '@mathesar/models/Database';
  import {
    type ProcessedColumns,
    TableStructure,
  } from '@mathesar/stores/table-data';

  import FieldChainTail from './FieldChainTail.svelte';

  export let database: Pick<Database, 'id'>;
  export let columnIds: number[];
  export let columns: ProcessedColumns;
  export let onUpdate: (columnIds: number[]) => void;

  $: column = defined(columnIds[0], (c) => columns.get(c));
  $: referentTable = defined(
    column?.linkFk?.referent_table_oid,
    (oid) => new TableStructure({ database, table: { oid } }),
  );
</script>

{#if columnIds[0] !== undefined && column === undefined}
  <div class="deleted-column">{$_('deleted_column')}</div>
{:else}
  <div class="column-select">
    <SelectProcessedColumn
      columns={[...columns.values()]}
      value={column}
      onUpdate={(c) => onUpdate(c ? [c.id] : [])}
      allowEmpty
    />
    {#if referentTable}
      <div class="delimiter">
        <FieldDelimiter />
      </div>
    {/if}
  </div>
{/if}

{#if referentTable}
  <FieldChainTail
    {database}
    columnIds={columnIds.slice(1)}
    {referentTable}
    onUpdate={(ids) =>
      onUpdate([...(defined(column, (c) => [c.id]) ?? []), ...ids])}
  />
{/if}

<style>
  .column-select {
    display: flex;
    align-items: center;
    /* We need some margin here in order to vertically multiple column select
    elements when there are so many that they wrap within the same template
    part. */
    margin: var(--column-select-margin) 0;
  }
  .deleted-column {
    margin-top: 0.7rem;
    color: var(--sand-600);
    font-size: var(--text-size-small);
    font-style: italic;
  }
  .delimiter {
    margin: 0 0.1rem;
  }
</style>
