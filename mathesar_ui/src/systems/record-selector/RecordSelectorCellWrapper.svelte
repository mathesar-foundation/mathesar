<script lang="ts">
  import { ensureReadable } from '@mathesar-component-library';
  import type { OverflowDetails } from '@mathesar/utils/overflowObserver';
  import type {
    CellLayoutRowType,
    CellLayoutColumnType,
  } from './recordSelectorUtils';

  export let rowType: CellLayoutRowType;
  export let rowIsSelected = false;
  export let columnType: CellLayoutColumnType;
  export let overflowDetails: OverflowDetails | undefined = undefined;
  export let title: string | undefined = undefined;
  export let showAboveOverlay = false;

  $: hasOverflowTop = ensureReadable(overflowDetails?.hasOverflowTop ?? false);
  $: hasOverflowLeft = ensureReadable(
    overflowDetails?.hasOverflowLeft ?? false,
  );
</script>

<div
  class="td"
  class:column-header={rowType === 'columnHeaderRow'}
  class:row-header={columnType === 'rowHeaderColumn'}
  class:row-is-selected={rowIsSelected}
  class:table-overflow-top={$hasOverflowTop}
  class:table-overflow-left={$hasOverflowLeft}
  class:show-above-overlay={showAboveOverlay}
  {title}
>
  <slot />
</div>

<style>
  .td {
    --max-column-width: 30ch;
    --outline-color: var(--sky-600);
    --separator-width: 7px;
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
    max-width: var(--max-column-width);
  }
  .td:first-child {
    border-left-width: var(--border-width);
  }

  .column-header {
    background: var(--slate-100);
    border-bottom-width: var(--separator-width);
    position: sticky;
    top: 0;
    z-index: var(--z-index__record_selector__thead);
    min-width: max-content;
    box-sizing: content-box;
  }

  .row-header {
    padding: 0 0.5rem;
    position: sticky;
    left: 0;
    z-index: var(--z-index__record_selector__row-header);
    background: var(--slate-100);
    min-width: 3ch;
  }
  .row-header.row-is-selected {
    background: var(--slate-300);
  }

  .column-header.row-header {
    z-index: var(--z-index__record_selector__thead-row-header);
  }

  .show-above-overlay {
    z-index: var(--z-index__record_selector__above-overlay);
  }

  /** Overflow shadows ********************************************************/
  .td {
    /**
     * We add this spread to create even-looking shadows. Without it, the
     * shadows look a little bumpy due to the fact that they're set on many
     * small elements instead of one large element.
     */
    --overflow-shadow-spread: 0.5rem;
    --overflow-shadow: 0 0 var(--overflow-shadow-size)
      var(--overflow-shadow-spread) var(--overflow-shadow-color);
    --clip-path-size: -1rem;
  }
  .table-overflow-left.row-header {
    box-shadow: calc(-1 * var(--overflow-shadow-spread)) 0
      var(--overflow-shadow-size) var(--overflow-shadow-spread)
      var(--overflow-shadow-color);
    clip-path: inset(0 var(--clip-path-size) 0 0);
  }
  .table-overflow-top.column-header {
    box-shadow: 0 calc(-1 * var(--overflow-shadow-spread))
      var(--overflow-shadow-size) var(--overflow-shadow-spread)
      var(--overflow-shadow-color);
    clip-path: inset(0 0 var(--clip-path-size) 0);
  }
  .table-overflow-top.table-overflow-left.row-header.column-header {
    box-shadow: calc(-1 * var(--overflow-shadow-spread))
      calc(-1 * var(--overflow-shadow-spread)) var(--overflow-shadow-size)
      var(--overflow-shadow-spread) var(--overflow-shadow-color);
    clip-path: inset(0 var(--clip-path-size) var(--clip-path-size) 0);
  }
</style>
