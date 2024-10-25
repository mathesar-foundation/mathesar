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

  $: column = defined(columnIds[0], (c) => columns.get(c));
  $: referentTable = defined(
    column?.linkFk?.referent_table_oid,
    (oid) => new TableStructure({ database, table: { oid } }),
  );
</script>

{#if column}
  <div class="column-select">
    <SelectProcessedColumn columns={[...columns.values()]} value={column} />
    {#if referentTable}
      <div class="delimiter"><Icon {...iconFieldDelimiter} /></div>
    {/if}
  </div>
  {#if referentTable}
    <FieldChainTail {database} columnIds={columnIds.slice(1)} {referentTable} />
  {/if}
{/if}

<style>
  .column-select {
    display: flex;
    align-items: center;
  }
  .delimiter {
    color: var(--sand-600);
    margin: 0 0.1rem;
  }
</style>
