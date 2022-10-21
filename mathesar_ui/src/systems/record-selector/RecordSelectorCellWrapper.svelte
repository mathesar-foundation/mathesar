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
  class:has-outline={state === 'focused' || state === 'acquiringFkValue'}
  class:is-acquiring-fk-value={state === 'acquiringFkValue'}
>
  <slot />
</svelte:element>

<style>
  .cell-wrapper {
    --border-color: #e7e7e7;
    border: solid 1px var(--border-color);
    overflow: hidden;
    font-weight: inherit;
    text-align: inherit;
    font-size: inherit;
  }
  .is-column-header {
    background: #f7f8f8;
  }
  .is-input {
    border-bottom: solid 10px var(--border-color);
    background: white;
  }
  .has-outline {
    --outline-color: #428af4;
    z-index: var(--z-index-above-overlay);
    border-radius: 2px;
    box-shadow: 0 0 0 3px var(--outline-color);
  }
  .is-acquiring-fk-value {
    --outline-color: #888;
    pointer-events: none;
  }
</style>
