<script lang="ts">
  import { MAX_COLUMN_WIDTH_PX, MIN_COLUMN_WIDTH_PX } from '@mathesar/geometry';
  import { slider } from '@mathesar-component-library';

  import { getSheetContext } from './utils';

  const { api, stores } = getSheetContext();

  export let minColumnWidth = MIN_COLUMN_WIDTH_PX;
  export let maxColumnWidth = MAX_COLUMN_WIDTH_PX;
  export let columnId: string;

  let startingWidth: number | undefined = undefined;

  $: ({ selectionInProgress } = stores);
</script>

<div
  class="column-resizer"
  class:selection-in-progress={$selectionInProgress}
  class:is-resizing={!!startingWidth}
  use:slider={{
    getStartingValue: () => api.getColumnWidth(columnId) ?? 0,
    onMove: (width) => api.handleDraggingColumnWidth(columnId, width),
    onStart: (startingValue) => {
      startingWidth = startingValue;
    },
    onStop: (width) => {
      if (width !== startingWidth) {
        api.handleReleaseColumnWidth(columnId, width);
      }
      startingWidth = undefined;
    },
    min: minColumnWidth,
    max: maxColumnWidth,
  }}
  on:dblclick={() => {
    api.handleReleaseColumnWidth(columnId, null);
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
    background: var(--color-bg-help-strong);
  }
  .column-resizer:not(:hover):not(.is-resizing) .indicator {
    display: none;
  }
  .column-resizer.selection-in-progress {
    display: none;
  }
</style>
