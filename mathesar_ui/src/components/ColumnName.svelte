<script lang="ts">
  import type { CellColumnLike } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
  import { getColumnIconProps } from './cell-fabric/utils';
  import TypeIcon from './TypeIcon.svelte';

  export let column: CellColumnLike & { name: string };

  $: icon = getColumnIconProps(column);
</script>

<span class="column-name">
  <span class="icon"><TypeIcon {icon} /></span>
  <span class="name">
    {column.name}
  </span>
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
