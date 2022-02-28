<script lang="ts">
  // This component is meant to be common for tables, views, and for import preview

  import type { Column } from '@mathesar/stores/table-data/types';
  import { getCellComponentWithProps } from './utils';

  export let column: Column;
  export let value: unknown;
  export let isActive = false;

  // TODO (IMPORTANT): Calculate this at a higher level, instead of calculating on each cell instance
  $: [cellComponent, cellProps] = getCellComponentWithProps(column);
</script>

<!--
  We need this parent div here because there's no other way to target css
  for child components without making the styles global
-->
<div class="sheet-cell">
  <svelte:component
    this={cellComponent}
    {...cellProps}
    {isActive}
    readonly={column.primary_key}
    bind:value
    on:movementKeyDown
    on:activate
    on:update
  />
</div>

<style lang="scss">
  .sheet-cell,
  .sheet-cell :global(.cell-wrapper) {
    overflow: hidden;
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: 29px;
  }

  .sheet-cell :global(.cell-wrapper) {
    padding: 6px 8px;

    &:not(.is-active) {
      // This needs to be based on row height!
      height: 29px;
      max-height: 29px;
    }
  }
</style>
