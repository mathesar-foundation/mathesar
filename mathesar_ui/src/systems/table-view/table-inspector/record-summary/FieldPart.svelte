<script lang="ts">
  import type { Database } from '@mathesar/models/Database';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';

  import FieldChain from './FieldChain.svelte';
  import Part from './Part.svelte';

  export let database: Pick<Database, 'id'>;
  export let columnIds: number[];
  export let columns: ProcessedColumns;
  export let onDelete: () => void;
  export let onUpdate: (columnIds: number[]) => void;
</script>

<Part {onDelete}>
  <div class="chain">
    <FieldChain {columns} {columnIds} {database} {onUpdate} />
  </div>
</Part>

<style>
  .chain {
    display: flex;
    flex-wrap: wrap;
  }
</style>
