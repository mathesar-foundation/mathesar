<script lang="ts">
  import type { CellState, CellType } from './recordSelectorUtils';

  let className = '';
  export { className as class };
  export let cellType: CellType;
  export let state: CellState | undefined = undefined;

  $: element = cellType === 'columnHeader' ? 'th' : 'td';
</script>

<svelte:element
  this={element}
  class="cell-wrapper {className}"
  class:is-column-header={cellType === 'columnHeader'}
  class:is-input={cellType === 'searchInput'}
  class:is-row-header={cellType === 'rowHeader'}
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:is-acquiring-fk-value={state === 'acquiringFkValue'}
>
  <slot />
</svelte:element>

<style>
  .cell-wrapper {
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
  .cell-wrapper:first-child {
    border-left-width: var(--border-width);
  }
  .is-column-header {
    background: #f7f8f8;
  }
  .is-input {
    border-bottom-width: 10px;
    background: white;
  }
  .is-row-header {
    border: none;
  }
  /* TODO Re-do outline with a nested element */
  /* .has-outline {
    --outline-color: #428af4;
    z-index: var(--z-index-above-overlay);
    border-radius: 2px;
    box-shadow: 0 0 0 3px var(--outline-color);
  } */
  .is-acquiring-fk-value {
    --outline-color: #888;
    pointer-events: none;
  }
</style>
