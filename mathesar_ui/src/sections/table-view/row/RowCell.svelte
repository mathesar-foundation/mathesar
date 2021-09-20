<script lang="ts">
  import type {
    ColumnPosition,
    TableRecord,
    TableColumn,
  } from '@mathesar/stores/table-data/types';

  export let columnPosition: ColumnPosition;
  export let row: TableRecord;
  export let column: TableColumn;
</script>

<div class="cell" style="
    width:{columnPosition?.width || 0}px;
    left:{columnPosition?.left || 0}px;">
  {typeof row[column.name] !== 'undefined' ? row[column.name] : ''}

  {#if !row.__state || row.__state === 'loading'}
    <div class="loader"></div>
  {/if}
</div>
