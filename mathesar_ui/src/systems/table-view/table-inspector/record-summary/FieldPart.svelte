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

<Part label="Column" {onDelete}>
  <FieldChain {columns} {columnIds} {database} />
</Part>
