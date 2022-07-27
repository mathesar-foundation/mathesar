<script lang="ts">
  import type { Column } from '@mathesar/api/tables/columns';
  import { getColumnIconProps } from './cell/utils';
  import TypeIcon from './TypeIcon.svelte';

  export let column: Column;

  $: icon = getColumnIconProps(column);
</script>

<span class="column-name">
  <span class="icon"><TypeIcon {icon} /></span>
  <span class="name">{column.name}</span>
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
