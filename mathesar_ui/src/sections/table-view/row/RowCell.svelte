<script lang="ts">
  import { tick } from 'svelte';
  import { faBackspace } from '@fortawesome/free-solid-svg-icons';
  import { ContextMenu, MenuItem } from '@mathesar-component-library';
  import {
    isCellActive,
    scrollBasedOnActiveCell,
  } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    Row,
    Column,
    Display,
    RecordsData,
  } from '@mathesar/stores/table-data/types';
  import Cell from '@mathesar/components/cell/Cell.svelte';
  import Null from '@mathesar/components/Null.svelte';

  export let recordsData: RecordsData;
  export let display: Display;
  export let columnPosition: ColumnPosition | undefined = undefined;
  export let row: Row;
  export let column: Column;
  export let value: unknown = undefined;

  $: ({ activeCell } = display);
  $: isActive = $activeCell && isCellActive($activeCell, row, column);
  $: isLoading = !row.state || row.state === 'loading';
  $: canSetNull = column.nullable && value !== null;

  // TODO: Set individual cell states and errors in recordsData

  async function checkTypeAndScroll(type?: string) {
    if (type === 'moved') {
      await tick();
      scrollBasedOnActiveCell();
    }
  }

  async function moveThroughCells(
    event: CustomEvent<{ originalEvent: KeyboardEvent; key: string }>,
  ) {
    const { originalEvent, key } = event.detail;
    const type = display.handleKeyEventsOnActiveCell(key);
    if (type) {
      originalEvent.stopPropagation();
      originalEvent.preventDefault();

      await checkTypeAndScroll(type);
    }
  }

  async function setValue(newValue: unknown) {
    if (newValue !== value) {
      value = newValue;
      if (row.isNew) {
        await recordsData.createOrUpdateRecord(row, column);
      } else {
        await recordsData.updateCell(row, column);
      }
    }
  }

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
  }
</script>

<div
  class="cell editable-cell"
  class:is-active={isActive}
  class:is-pk={column.primary_key}
  style="
      width:{columnPosition?.width ?? 0}px;
      left:{columnPosition?.left ?? 0}px;
    "
>
  <Cell
    {column}
    {isActive}
    {value}
    state={isLoading ? 'loading' : 'ready'}
    on:movementKeyDown={moveThroughCells}
    on:activate={() => display.selectCell(row, column)}
    on:update={valueUpdated}
  />
  <ContextMenu>
    <MenuItem
      icon={{ data: faBackspace }}
      disabled={!canSetNull}
      on:click={() => setValue(null)}
    >
      Set to <Null />
    </MenuItem>
  </ContextMenu>
</div>

<style lang="scss">
  .editable-cell.cell {
    user-select: none;
    background-color: #fff;

    &.is-active {
      z-index: 5;
      background: #fff !important;
      border: none;
      min-height: 100%;
      height: auto !important;
    }
  }
</style>
