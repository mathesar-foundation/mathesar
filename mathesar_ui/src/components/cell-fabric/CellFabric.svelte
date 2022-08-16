<!--
  @component

  This component is meant to be common for tables, queries, and for import preview
-->
<script lang="ts">
  import type { CellColumnFabric } from './types';

  export let columnFabric: CellColumnFabric;
  export let value: unknown;
  export let isActive = false;
  export let isSelectedInRange = false;
  export let disabled = false;
  export let showAsSkeleton = false;

  $: ({ cellComponentAndProps } = columnFabric);
  $: ({ component } = cellComponentAndProps);
  $: props = cellComponentAndProps.props as Record<string, unknown>;
</script>

<div class="cell-fabric" data-column-identifier={columnFabric.id}>
  <svelte:component
    this={component}
    {...props}
    {isActive}
    {isSelectedInRange}
    {disabled}
    bind:value
    on:movementKeyDown
    on:activate
    on:update
    on:mouseenter
  />

  {#if showAsSkeleton}
    <div class="loader" />
  {/if}
</div>

<style lang="scss">
  .cell-fabric {
    --cell-height: 29px;
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: var(--cell-height);
    align-items: center;
    width: 100%;
  }

  .cell-fabric {
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
