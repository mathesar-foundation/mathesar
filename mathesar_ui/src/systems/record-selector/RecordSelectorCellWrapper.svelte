<script lang="ts">
  import { ensureReadable } from '@mathesar-component-library';
  import type { OverflowDetails } from '@mathesar/utils/overflowObserver';
  import type {
    CellLayoutRowType,
    CellState,
    CellLayoutColumnType,
  } from './recordSelectorUtils';

  export let rowType: CellLayoutRowType;
  export let columnType: CellLayoutColumnType;
  export let state: CellState | undefined = undefined;
  export let overflowDetails: OverflowDetails | undefined = undefined;
  export let title: string | undefined = undefined;

  $: hasOverflowTop = ensureReadable(overflowDetails?.hasOverflowTop ?? false);
  $: hasOverflowRight = ensureReadable(
    overflowDetails?.hasOverflowRight ?? false,
  );
</script>

<div
  class="td"
  class:column-header={rowType === 'columnHeaderRow'}
  class:input={rowType === 'searchInputRow'}
  class:divider={rowType === 'dividerRow'}
  class:row-header={columnType === 'rowHeaderColumn'}
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:acquiring-fk-value={state === 'acquiringFkValue'}
  class:table-overflow-top={$hasOverflowTop}
  class:table-overflow-right={$hasOverflowRight}
  {title}
>
  <slot />
  {#if rowType === 'dividerRow'}
    <div class="divider-bg" />
  {/if}
  {#if rowType === 'searchInputRow'}
    <div class="outline" />
  {/if}
</div>

<style lang="scss">
  .td {
    display: table-cell;
    vertical-align: middle;
    border-style: solid;
    border-color: var(--border-color);
    border-width: 0;
    /** Set from parent to so that first row gets border */
    border-top-width: var(--border-top-width, 0);
    border-right-width: var(--border-width);
    border-bottom-width: var(--border-width);
    min-width: 8ch;
    max-width: 30ch;
    --outline-color: #428af4;
  }
  .td:first-child {
    border-left-width: var(--border-width);
  }

  /** Row types ***************************************************************/
  .column-header {
    background: var(--slate-100);
    padding: 0 0.5rem;
    /** 0.5px below is a hack to deal with a Firefox-only issue. When vertically
     * scrolling the table, the data cells were peeking through between a tiny
     * sub-pixel gap between the column header cell and the input cell, but only
     * at certain zoom levels.*/
    height: calc(var(--row-height) - 2 * var(--border-width) + 0.5px);
    position: sticky;
    top: 0;
    z-index: var(--z-index__record_selector__thead);
    min-width: max-content;
    box-sizing: content-box;
  }
  .input {
    background: white;
    height: var(--row-height);
    position: sticky;
    top: var(--row-height);
    z-index: var(--z-index__record_selector__thead);
  }
  .divider {
    height: 8px;
    border: none;
    position: sticky;
    z-index: var(--z-index__record-selector__divider);
    top: calc(2 * var(--row-height));
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

  /** Column types ************************************************************/
  .row-header {
    //padding-left: 0.5rem;

    background: var(--slate-100);
    //padding-right: calc(var(--body-padding) + var(--extra-body-padding));
    position: sticky;
    right: 0;
    z-index: var(--z-index__record_selector__row-header);

    > :global(.btn-secondary) {
      width: 100%;
      border: none;
      height: var(--row-height);
      border-radius: 0px;
      font-weight: 600;
    }
  }

  /** Upper right corner ******************************************************/
  .column-header.row-header,
  .input.row-header,
  .divider.row-header {
    z-index: var(--z-index__record_selector__thead-row-header);
  }

  /** Focus indicator *********************************************************/
  .has-outline {
    z-index: var(--z-index__record_selector__focused-input);
  }
  .outline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: var(--focus-highlight-width);
    pointer-events: none;
    box-shadow: 0 0 0 var(--focus-highlight-width) var(--outline-color);
  }
  .td:not(.has-outline) .outline {
    display: none;
  }
  .acquiring-fk-value {
    --outline-color: #888;
    z-index: var(--z-index__record_selector__above-overlay);
    pointer-events: none;
  }
  .has-outline.table-overflow-right {
    z-index: var(--z-index__record_selector__focused-input-with-overflow);
  }

  /** Overflow shadows ********************************************************/
  .table-overflow-top.divider .divider-bg {
    box-shadow: var(--overflow-shadow);
    clip-path: inset(0 0 var(--clip-path-size) 0);
  }
  .table-overflow-top.divider .divider-bg {
    background: var(--border-color);
  }
  .table-overflow-right.row-header {
    box-shadow: var(--overflow-shadow);
    clip-path: inset(0 0 0 var(--clip-path-size));
  }
</style>
