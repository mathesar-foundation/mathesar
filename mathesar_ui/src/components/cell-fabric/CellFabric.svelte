<!--
  @component

  This component is meant to be common for tables, queries, and for import preview
-->
<script lang="ts">
  import type { HorizontalAlignment } from './data-types/components/typeDefinitions';
  import type { CellColumnFabric } from './types';

  export let columnFabric: CellColumnFabric;
  export let value: unknown;
  export let recordSummary: string | undefined = undefined;
  export let setRecordSummary:
    | ((recordId: string, recordSummary: string) => void)
    | undefined = undefined;
  export let isActive = false;
  export let isSelectedInRange = false;
  export let disabled = false;
  export let showAsSkeleton = false;
  export let horizontalAlignment: HorizontalAlignment | undefined = undefined;
  export let searchValue: unknown | undefined = undefined;
  export let isProcessing = false;

  $: ({ cellComponentAndProps } = columnFabric);
  $: ({ component } = cellComponentAndProps);
  $: props = cellComponentAndProps.props as Record<string, unknown>;
</script>

<div
  class="cell-fabric"
  data-column-identifier={columnFabric.id}
  class:show-as-skeleton={showAsSkeleton}
>
  <svelte:component
    this={component}
    {...props}
    {isActive}
    {isSelectedInRange}
    {disabled}
    {horizontalAlignment}
    {recordSummary}
    {setRecordSummary}
    {searchValue}
    {isProcessing}
    bind:value
    on:movementKeyDown
    on:activate
    on:update
    on:mouseenter
  />

  <div class="loader">
    <div class="bg" />
  </div>
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
    --cell-padding: 0.5rem;
    isolation: isolate;
  }
  .loader {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    background: white;
    z-index: 1;
  }
  .bg {
    top: var(--cell-padding);
    left: var(--cell-padding);
    right: var(--cell-padding);
    bottom: var(--cell-padding);
    position: absolute;
    background: #efefef;
  }
  .cell-fabric:not(.show-as-skeleton) .loader {
    display: none;
  }
</style>
