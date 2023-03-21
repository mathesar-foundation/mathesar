<script lang="ts">
  import { ImmutableMap } from '@mathesar-component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    type TabularDataSelection,
  } from '@mathesar/stores/table-data';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { orderProcessedColumns } from '@mathesar/utils/tables';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import TableInspector from './table-inspector/TableInspector.svelte';

  type Context = 'page' | 'widget';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: canExecuteDDL = !!$userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );

  export let context: Context = 'page';
  export let table: Pick<TableEntry, 'id' | 'settings' | 'schema'>;

  $: usesVirtualList = context === 'page';
  $: allowsDdlOperations = context === 'page' && canExecuteDDL;
  $: sheetHasBorder = context === 'widget';
  $: ({ processedColumns, display, isLoading, selection } = $tabularData);
  $: ({ activeCell } = selection);
  $: ({ horizontalScrollOffset, scrollOffset, isTableInspectorVisible } =
    display);
  $: ({ settings } = table);
  $: ({ column_order: columnOrder } = settings);
  $: hasNewColumnButton = allowsDdlOperations;
  /**
   * These are separate variables for readability and also to keep the door open
   * to more easily displaying the Table Inspector even if DDL operations are
   * not supported.
   */
  $: supportsTableInspector = context === 'page';
  $: sheetColumns = (() => {
    const orderedProcessedColumns = orderProcessedColumns(
      $processedColumns,
      table,
    );
    const columns = [
      { column: { id: ID_ROW_CONTROL_COLUMN, name: 'ROW_CONTROL' } },
      ...orderedProcessedColumns.values(),
    ];
    if (hasNewColumnButton) {
      columns.push({ column: { id: ID_ADD_NEW_COLUMN, name: 'ADD_NEW' } });
    }
    return columns;
  })();

  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, rowHeaderWidthPx],
    [ID_ADD_NEW_COLUMN, 32],
  ]);
  $: showTableInspector = $isTableInspectorVisible && supportsTableInspector;

  function selectAndActivateFirstCellOnTableLoad(
    _isLoading: boolean,
    _selection: TabularDataSelection,
    _context: Context,
  ) {
    // We only activate the first cell on the page, not in the widget. Doing so
    // on the widget causes the cell to focus and the page to scroll down to
    // bring that element into view.
    if (_context === 'page' && !_isLoading) {
      _selection.selectAndActivateFirstCellIfExists();
    }
  }

  function checkAndReinstateFocusOnActiveCell(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-sheet-element="cell"')) {
      if ($activeCell) {
        selection.focusCell(
          { rowIndex: $activeCell.rowIndex },
          { id: Number($activeCell.columnId) },
        );
      }
    }
  }

  $: void selectAndActivateFirstCellOnTableLoad($isLoading, selection, context);

  let isResizing = false;
  let startingPointerX: number | undefined;
  let startingColumnWidth: number | undefined;
  let minInspectorwidth: 80;

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
      minInspectorwidth,
    );
    // Update the width of the sidebar
    const container = document.querySelector('.table-inspector-container') as HTMLElement;
    container.style.width = `${newColumnWidth}px`;
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
    // Remove the class that indicates that the user is resizing the sidebar
    const resizer = document.querySelector('.inspector-resizer') as HTMLElement;
    resizer.classList.remove('is-resizing');
  }

  function startColumnResize(e: MouseEvent | TouchEvent) {
    isResizing = true;
    startingColumnWidth = undefined;
    startingPointerX = getPointerX(e);
    window.addEventListener('mousemove', resize, true);
    window.addEventListener('touchmove', resize, true);
    window.addEventListener('mouseup', stopColumnResize, true);
    window.addEventListener('touchend', stopColumnResize, true);
    window.addEventListener('touchcancel', stopColumnResize, true);
    // Add the class that indicates that the user is resizing the sidebar
    const resizer = document.querySelector('.inspector-resizer') as HTMLElement;
    resizer.classList.add('is-resizing');
  }
  
</script>

<div class="table-view">
  <div class="table-inspector-view">
    <div class="sheet-area" on:click={checkAndReinstateFocusOnActiveCell}>
      {#if $processedColumns.size}
        <Sheet
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          {usesVirtualList}
          {columnWidths}
          hasBorder={sheetHasBorder}
          restrictWidthToRowWidth={!usesVirtualList}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
        >
          <Header {hasNewColumnButton} {columnOrder} {table} />
          <Body {usesVirtualList} />
        </Sheet>
      {/if}
    </div>
    {#if showTableInspector}
      <div
        class="inspector-resizer" 
        class:is-resizing={isResizing}
        on:dragstart
        on:mousedown={startColumnResize}
        on:touchstart|nonpassive={startColumnResize}
      >
        <TableInspector />
      </div> 
    {/if}
  </div>
  <StatusPane {context} />
</div>

<style>
  .table-view {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    overflow: hidden;
  }
  .table-inspector-view {
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }
  .sheet-area {
    position: relative;
    overflow-x: auto;
    flex: 1;
  }
  .inspector-resizer {
    --width: 800px;
    position: absolute;
    width: var(--width);
    right: calc(-1 * var(--width) / 2);
    z-index: var(--z-index__sheet__column-resizer);
    cursor: e-resize;
    display: flex;
    justify-content: center;
  }
</style>
