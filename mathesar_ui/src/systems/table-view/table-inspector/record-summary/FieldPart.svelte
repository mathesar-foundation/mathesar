<script lang="ts">
  import type { Database } from '@mathesar/models/Database';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';

  import FieldChain from './FieldChain.svelte';
  import Part from './Part.svelte';

  export let database: Pick<Database, 'id'>;
  export let columnIds: number[];
  export let columns: ProcessedColumns;
  export let onDelete: () => void;
</script>

<Part {onDelete}>
  <div class="chain">
    <FieldChain {columns} {columnIds} {database} />
  </div>
</Part>

<style>
  .chain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: var(--text-size-small);
  }
</style>
