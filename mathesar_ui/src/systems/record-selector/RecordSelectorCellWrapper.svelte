<script lang="ts">
  import type { CellState, CellType } from './recordSelectorUtils';

  export let cellType: CellType;
  export let state: CellState | undefined = undefined;
</script>

<div
  class="td"
  class:column-header={cellType === 'columnHeader'}
  class:input={cellType === 'searchInput'}
  class:divider={cellType === 'divider'}
  class:row-header={cellType === 'rowHeader'}
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:acquiring-fk-value={state === 'acquiringFkValue'}
>
  <slot />
  {#if cellType === 'divider'}
    <div class="divider-bg" />
  {/if}
</div>

<style>
  .td {
    display: table-cell;
    vertical-align: middle;
    overflow: hidden;
    font-weight: inherit;
    text-align: inherit;
    font-size: inherit;
    border-style: solid;
    border-color: var(--border-color);
    border-width: 0;
    /** Set from parent to so that first row gets border */
    border-top-width: var(--border-top-width, 0);
    border-right-width: var(--border-width);
    border-bottom-width: var(--border-width);
    min-width: 8ch;
  }
  .td:first-child {
    border-left-width: var(--border-width);
  }
  .column-header {
    background: #f7f8f8;
  }
  .input {
    background: white;
  }
  .divider {
    height: 10px;
    border: none;
    position: relative;
    background: white;
    overflow: visible;
  }
  .divider .divider-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--border-color);
  }
  .divider:last-child .divider-bg {
    background: white;
    width: calc(100% - var(--body-padding) + 1px);
  }
  .row-header,
  .divider:last-child {
    padding-left: 0.5rem;
    border: none;
    background: white;
    padding-right: calc(var(--body-padding) + 0.5rem);
    position: sticky;
    right: 0;
  }
  /* TODO Re-do outline with a nested element */
  /* .has-outline {
    --outline-color: #428af4;
    z-index: var(--z-index-above-overlay);
    border-radius: 2px;
    box-shadow: 0 0 0 3px var(--outline-color);
  } */
  .acquiring-fk-value {
    --outline-color: #888;
    pointer-events: none;
  }
</style>
