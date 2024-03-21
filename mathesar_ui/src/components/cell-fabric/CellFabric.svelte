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
  export let disabled = false;
  export let showAsSkeleton = false;
  export let horizontalAlignment: HorizontalAlignment | undefined = undefined;
  export let searchValue: unknown | undefined = undefined;
  export let isProcessing = false;
  export let isIndependentOfSheet = false;
  export let showTruncationPopover = false;
  export let canViewLinkedEntities = true;
  export let lightText = false;

  $: ({ cellComponentAndProps } = columnFabric);
  $: ({ component } = cellComponentAndProps);
  $: props = cellComponentAndProps.props as Record<string, unknown>;
</script>

<div
  class="cell-fabric"
  data-column-identifier={columnFabric.id}
  class:show-as-skeleton={showAsSkeleton}
  class:is-independent={isIndependentOfSheet}
  class:light-text={lightText}
>
  <svelte:component
    this={component}
    {...props}
    {columnFabric}
    {isActive}
    {disabled}
    {isIndependentOfSheet}
    {horizontalAlignment}
    {recordSummary}
    {setRecordSummary}
    {searchValue}
    {isProcessing}
    {showTruncationPopover}
    {canViewLinkedEntities}
    bind:value
    on:movementKeyDown
    on:update
  />

  <div class="loader">
    <div class="bg" />
  </div>
</div>

<style lang="scss">
  .cell-fabric {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    width: 100%;
    isolation: isolate;

    &:not(.is-independent) {
      --default-cell-height: 29px;
      --cell-padding: 0.5rem;
      min-height: var(--cell-height, var(--default-cell-height));
    }
    &.is-independent {
      --cell-padding: 0rem;
    }
  }
  .loader {
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
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
    background: var(--slate-100);
  }
  .cell-fabric:not(.show-as-skeleton) .loader {
    display: none;
  }
  .light-text {
    color: var(--cell-text-color-processing);
  }
</style>
