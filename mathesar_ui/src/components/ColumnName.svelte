<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import { getColumnIconProps } from './cell/utils';
  import TypeIcon from './TypeIcon.svelte';

  export let column: ProcessedColumn;

  $: icon = getColumnIconProps(column.column);
</script>

<span class="column-name">
  <span class="icon"><TypeIcon {icon} /></span>
  <span class="name">{column.column.name}</span>
</span>

<style>
  .column-name {
    display: flex;
    align-items: center;
  }

  .icon {
    display: inline-flex;
    margin-right: 5px;
  }

  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
