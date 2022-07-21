<script lang="ts">
  // TODO: Move this component within Sheet
  // This component is meant to be common for tables, views, and for import preview
  import type { SheetColumn } from '@mathesar/components/sheet/types';

  export let sheetColumn: SheetColumn;
  export let value: unknown;
  export let isActive = false;
  export let disabled = false;
  export let showAsSkeleton = false;

  $: ({ component, props } = sheetColumn.cellCap);
</script>

<div class="sheet-cell" data-column-id={sheetColumn.column.id}>
  <svelte:component
    this={component}
    {...props}
    {isActive}
    {disabled}
    bind:value
    on:movementKeyDown
    on:activate
    on:update
  />

  {#if showAsSkeleton}
    <div class="loader" />
  {/if}
</div>

<style lang="scss">
  .sheet-cell {
    --cell-height: 29px;
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: var(--cell-height);
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
</style>
