<script lang="ts">
  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { api } = getSheetContext<SheetColumnIdentifierKey>();

  export let minColumnWidth = 50;
  export let columnIdentifierKey: SheetColumnIdentifierKey;

  let isResizing = false;
  let startingPointerX: number | undefined;
  let startingColumnWidth: number | undefined;

  function isTouchEvent(e: MouseEvent | TouchEvent): e is TouchEvent {
    return 'touches' in e;
  }

  function getPointerX(e: MouseEvent | TouchEvent) {
    const singularEvent = isTouchEvent(e) ? e.touches[0] : e;
    return singularEvent.clientX;
  }

  function resize(e: MouseEvent | TouchEvent) {
    const pointerMovement = getPointerX(e) - (startingPointerX ?? 0);
    const newColumnWidth = Math.max(
      (startingColumnWidth ?? 0) + pointerMovement,
      minColumnWidth,
    );
    api.setColumnWidth(columnIdentifierKey, newColumnWidth);
  }

  function stopColumnResize() {
    isResizing = false;
    startingPointerX = undefined;
    startingColumnWidth = undefined;
    window.removeEventListener('mousemove', resize, true);
    window.removeEventListener('touchmove', resize, true);
    window.removeEventListener('mouseup', stopColumnResize, true);
    window.removeEventListener('touchend', stopColumnResize, true);
    window.removeEventListener('touchcancel', stopColumnResize, true);
    // TODO persist column width in local storage or via API
  }

  function startColumnResize(e: MouseEvent | TouchEvent) {
    isResizing = true;
    startingColumnWidth = api.getColumnWidth(columnIdentifierKey);
    startingPointerX = getPointerX(e);
    window.addEventListener('mousemove', resize, true);
    window.addEventListener('touchmove', resize, true);
    window.addEventListener('mouseup', stopColumnResize, true);
    window.addEventListener('touchend', stopColumnResize, true);
    window.addEventListener('touchcancel', stopColumnResize, true);
  }
</script>

<div
  class="column-resizer"
  class:is-resizing={isResizing}
  on:mousedown={startColumnResize}
  on:touchstart|nonpassive={startColumnResize}
  on:dblclick={() => api.resetColumnWidth(columnIdentifierKey)}
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
    background: var(--sky-700);
  }
  .column-resizer:not(:hover):not(.is-resizing) .indicator {
    display: none;
  }
</style>
