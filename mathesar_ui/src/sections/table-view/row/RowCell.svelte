<script lang="ts">
  import { tick } from 'svelte';
  import { iconBackspace } from '@mathesar/icons';

  import {
    ContextMenu,
    MenuItem,
    WritableMap,
  } from '@mathesar-component-library';
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
    CellKey,
  } from '@mathesar/stores/table-data/types';
  import Cell from '@mathesar/components/cell/Cell.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import type { RequestStatus } from '@mathesar/utils/api';
  import { States } from '@mathesar/utils/api';
  import CellErrors from './CellErrors.svelte';

  export let recordsData: RecordsData;
  export let display: Display;
  export let columnPosition: ColumnPosition | undefined = undefined;
  export let row: Row;
  export let key: CellKey;
  export let modificationStatusMap: WritableMap<CellKey, RequestStatus>;
  export let column: Column;
  export let value: unknown = undefined;

  $: recordsDataState = recordsData.state;
  $: ({ activeCell } = display);
  $: isActive = $activeCell && isCellActive($activeCell, row, column);
  $: modificationStatus = $modificationStatusMap.get(key);
  $: canSetNull = column.nullable && value !== null;

  async function checkTypeAndScroll(type?: string) {
    if (type === 'moved') {
      await tick();
      scrollBasedOnActiveCell();
    }
  }

  async function moveThroughCells(
    event: CustomEvent<{ originalEvent: KeyboardEvent; key: string }>,
  ) {
    const { originalEvent } = event.detail;
    const type = display.handleKeyEventsOnActiveCell(event.detail.key);
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
  class:error={modificationStatus?.state === 'failure'}
  class:modified={modificationStatus?.state === 'success'}
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
    showAsSkeleton={$recordsDataState === States.Loading}
    on:movementKeyDown={moveThroughCells}
    on:activate={() => display.selectCell(row, column)}
    on:update={valueUpdated}
  />
  <ContextMenu>
    <MenuItem
      icon={iconBackspace}
      disabled={!canSetNull}
      on:click={() => setValue(null)}
    >
      Set to <Null />
    </MenuItem>
  </ContextMenu>
  {#if modificationStatus?.state === 'failure'}
    <CellErrors errors={modificationStatus.errors} forceShowErrors={isActive} />
  {/if}
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

    &.modified {
      background-color: #ebfeef;
    }
    &.error {
      background-color: #fef1f1;
      color: #888;
    }
  }
</style>
