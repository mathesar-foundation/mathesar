<script lang="ts">
  import type {
    CellLayoutRowType,
    CellState,
    CellLayoutColumnType,
  } from './recordSelectorUtils';

  export let rowType: CellLayoutRowType;
  export let columnType: CellLayoutColumnType;
  export let state: CellState | undefined = undefined;
</script>

<div
  class="td"
  class:column-header={rowType === 'columnHeaderRow'}
  class:input={rowType === 'searchInputRow'}
  class:divider={rowType === 'dividerRow'}
  class:row-header={columnType === 'rowHeaderColumn'}
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:acquiring-fk-value={state === 'acquiringFkValue'}
>
  <slot />
  {#if rowType === 'dividerRow'}
    <!-- TODO I'm not sure we need this extra element anymore. Can we just set a
  background on the main element instead? -->
    <div class="divider-bg" />
  {/if}
  {#if rowType === 'searchInputRow'}
    <div class="outline" />
  {/if}
</div>

<style>
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
    background: #f7f8f8;
    padding: 0 0.5rem;
    height: var(--row-height);
    position: sticky;
    top: 0;
    z-index: var(--z-index-thead);
  }
  .input {
    background: white;
    position: relative;
    height: var(--row-height);
    position: sticky;
    top: var(--row-height);
    z-index: var(--z-index-thead);
  }
  .input :global(.input-element) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    resize: none;
  }
  .input :global(.input-element:focus) {
    border: none;
    outline: none;
  }
  .divider {
    height: 10px;
    border: none;
    position: sticky;
    z-index: var(--z-index-thead);
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
  .divider:last-child .divider-bg {
    background: white;
    width: calc(100% - var(--body-padding) + 1px);
  }

  /** Column types ************************************************************/
  .row-header {
    padding-left: 0.5rem;
    border: none;
    background: white;
    padding-right: calc(var(--body-padding) + 0.5rem);
    position: sticky;
    right: 0;
    z-index: var(--z-index-row-header);
  }

  /** Upper right corner ******************************************************/
  .column-header.row-header,
  .input.row-header,
  .divider.row-header {
    z-index: var(--z-index-thead-row-header);
  }

  /** Focus indicator *********************************************************/
  .has-outline {
    z-index: var(--z-index-focused-input);
  }
  .outline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 0.2rem;
    pointer-events: none;
    box-shadow: 0 0 0 0.2rem var(--outline-color);
  }
  .td:not(.has-outline) .outline {
    display: none;
  }
  .acquiring-fk-value {
    --outline-color: #888;
    z-index: var(--z-index-above-overlay);
  }
</style>
