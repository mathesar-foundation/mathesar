<script lang="ts">
  import type { Table } from '@mathesar/models/Table';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';

  import FieldChain from './FieldChain.svelte';
  import Part from './Part.svelte';

  export let table: Table;
  export let columnIds: string[];
  export let columns: ProcessedColumns;
  export let onDelete: () => void;
  export let onUpdate: (columnIds: string[]) => void;
</script>

<Part {onDelete}>
  <div class="chain">
    <FieldChain {columns} {columnIds} schema={table.schema} {onUpdate} />
  </div>
</Part>

<style>
  .chain {
    display: flex;
    flex-wrap: wrap;
  }
</style>
