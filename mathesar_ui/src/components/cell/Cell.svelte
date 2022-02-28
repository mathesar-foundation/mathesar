<script lang="ts">
  // This component is meant to be common for tables, views, and for import preview

  import type { Column } from '@mathesar/stores/table-data/types';
  import { getCellComponentWithProps } from './utils';

  export let column: Column;
  export let value: unknown;
  export let isActive = false;
  export let state: 'loading' | 'error' | 'ready' = 'ready';

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

  {#if state === 'loading'}
    <div class="loader" />
  {/if}
</div>

<style lang="scss">
  .sheet-cell,
  .sheet-cell :global(.cell-wrapper) {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: 29px;
    align-items: center;
    width: 100%;
  }

  .sheet-cell {
    .loader {
      top: 6px;
      left: 8px;
      right: 8px;
      bottom: 6px;
      position: absolute;
      background: #efefef;
    }
  }

  .sheet-cell :global(.cell-wrapper) {
    overflow: hidden;
    padding: 6px 8px;
  }

  .sheet-cell :global(.cell-wrapper:not(.is-active)) {
    // This needs to be based on row height!
    height: 29px;
    max-height: 29px;
  }

  .sheet-cell :global(.cell-wrapper.is-active) {
    box-shadow: 0 0 0 2px #428af4;
    border-radius: 2px;
  }

  .sheet-cell :global(.cell-wrapper.is-active.readonly) {
    box-shadow: 0 0 0 2px #a8a8a8;
  }
</style>
