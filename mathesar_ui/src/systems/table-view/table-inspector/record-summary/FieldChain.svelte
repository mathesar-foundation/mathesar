<script lang="ts">
  import { defined } from '@mathesar/component-library';
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

  $: column = defined(columnIds[0], (c) => columns.get(c));
  $: referentTable = defined(
    column?.linkFk?.referent_table_oid,
    (oid) => new TableStructure({ database, table: { oid } }),
  );
</script>

{#if column}
  <SelectProcessedColumn columns={[...columns.values()]} value={column} />
  {#if referentTable}
    <FieldChainTail {database} columnIds={columnIds.slice(1)} {referentTable} />
  {/if}
{/if}
