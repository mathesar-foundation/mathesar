<script lang="ts">
  import { Icon, defined } from '@mathesar/component-library';
  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import { iconFieldDelimiter } from '@mathesar/icons';
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

<div class="column-select">
  <SelectProcessedColumn
    columns={[...columns.values()]}
    value={column}
    onUpdate={(c) => onUpdate(c ? [c.id] : [])}
  />
  {#if referentTable}
    <div class="delimiter"><Icon {...iconFieldDelimiter} /></div>
  {/if}
</div>
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
  .delimiter {
    color: var(--sand-600);
    margin: 0 0.1rem;
  }
</style>
