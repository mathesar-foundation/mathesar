<script lang="ts">
  import { MAX_COLUMN_WIDTH_PX, MIN_COLUMN_WIDTH_PX } from '@mathesar/geometry';
  import { slider } from '@mathesar-component-library';

  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { api, stores } = getSheetContext<SheetColumnIdentifierKey>();

  export let minColumnWidth = MIN_COLUMN_WIDTH_PX;
  export let maxColumnWidth = MAX_COLUMN_WIDTH_PX;
  export let columnIdentifierKey: SheetColumnIdentifierKey;

  /**
   * Runs once — when the resize is finished. Does NOT run in realtime on each
   * pixel movement.
   */
  export let afterResize: (width: number) => void = () => {};

  /**
   * Runs after the user double-clicks the resizer (to reset the column width).
   */
  export let onReset: () => void = () => {};

  let startingWidth: number | undefined = undefined;

  $: ({ selectionInProgress } = stores);
</script>

<div
  class="column-resizer"
  class:selection-in-progress={$selectionInProgress}
  class:is-resizing={!!startingWidth}
  use:slider={{
    getStartingValue: () => api.getColumnWidth(columnIdentifierKey) ?? 0,
    onMove: (width) => api.setColumnWidth(columnIdentifierKey, width),
    onStart: (startingValue) => {
      startingWidth = startingValue;
    },
    onStop: (width) => {
      if (width !== startingWidth) {
        afterResize(width);
      }
      startingWidth = undefined;
    },
    min: minColumnWidth,
    max: maxColumnWidth,
  }}
  on:dblclick={() => {
    api.resetColumnWidth(columnIdentifierKey);
    onReset();
  }}
>
  <div class="indicator" />
</div>

<style>
  .column-resizer {
    --width: 1rem;
    position: absolute;
    width: var(--width);
    height: 100%;
    top: 0;
    right: calc(-1 * var(--width) / 2);
    z-index: var(--z-index__sheet__column-resizer);
    cursor: e-resize;
    display: flex;
    justify-content: center;
  }
  .indicator {
    position: relative;
    height: 100%;
    width: 0.3rem;
    background: var(--SYS-color-help-icon);
  }
  .column-resizer:not(:hover):not(.is-resizing) .indicator {
    display: none;
  }
  .column-resizer.selection-in-progress {
    display: none;
  }
</style>
