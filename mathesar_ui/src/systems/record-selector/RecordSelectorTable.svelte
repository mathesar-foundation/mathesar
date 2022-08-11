<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Row } from '@mathesar/stores/table-data/records';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  import { constraintIsFk } from '@mathesar/stores/table-data/constraintsUtils';
  import { ImmutableMap, Spinner } from '@mathesar/component-library';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import { setNewRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import NestedRecordSelector from './NestedRecordSelector.svelte';
  import QuarterCircle from './QuarterCircle.svelte';
  import Arrow from './Arrow.svelte';
  import RecordSelectorInput from './RecordSelectorInput.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;

  const tabularDataStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataStore);

  const nestedRecordSelectorController =
    setNewRecordSelectorControllerInContext();

  /**
   * The id of the column (if any) which has focus.
   *
   * For non-FK cells, this value will be reset to `undefined` when the input
   * loses focus (e.g. clicking on blank space within the modal). But for FK
   * cells, this value will remain set to the FK column id while the nested
   * record selector is open.
   */
  let activeColumnId: number | undefined = undefined;

  let inputsRow: HTMLElement;

  $: tabularDataStore.set(tabularData);
  $: ({ columnsDataStore, constraintsDataStore, display, meta, isLoading } =
    tabularData);
  $: ({ constraints } = $constraintsDataStore);
  $: ({ columns } = $columnsDataStore);
  $: pkColumn = columns.find((c) => c.primary_key);
  $: nestedSelectorIsOpen = nestedRecordSelectorController.isOpen;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;

  /** keys are column ids, values are FK constraints */
  $: fkConstraintMap = new ImmutableMap(
    constraints
      .filter(constraintIsFk)
      .filter((c) => c.columns.length === 1)
      .map((c) => [c.columns[0], c]),
  );

  $: activeColumnIsFk = activeColumnId && fkConstraintMap.has(activeColumnId);

  function getPkValue(row: Row): string | number {
    if (!pkColumn) {
      throw new Error('No primary key column found');
    }
    const { record } = row;
    if (!record) {
      throw new Error('No record found within row.');
    }
    const pkValue = record[pkColumn.id];
    if (!(typeof pkValue === 'string' || typeof pkValue === 'number')) {
      throw new Error('Primary key value is not a string or number.');
    }
    return pkValue;
  }

  function handleSubmitRecord(row: Row) {
    controller.submit(getPkValue(row));
  }

  function handleInputFocus(columnId: number) {
    activeColumnId = columnId;
    if (!fkConstraintMap.get(columnId)) {
      nestedRecordSelectorController.cancel();
    }
  }

  function handleInputBlur(columnId: number) {
    if (activeColumnId === columnId && !activeColumnIsFk) {
      activeColumnId = undefined;
    }
  }

  function programmaticallyFocusInput(columnId: number) {
    const input = inputsRow.querySelector(
      `.record-selector-input.column-${columnId}`,
    ) as HTMLElement | undefined;
    if (!input) {
      throw new Error(`No input found for columnId: ${columnId}`);
    }
    input.focus();
    // This is redundant with the handler attached to DynamicInput, but for some
    // reason Svelte doesn't fire it when programmatically focusing the input.
    handleInputFocus(columnId);
  }

  function focusNextColumn(columnId: number) {
    if (columns.length <= 1) {
      return;
    }
    const index = columns.findIndex((c) => c.id === columnId);
    if (index === -1) {
      return;
    }
    const column = columns[index + 1] ?? columns[0];
    programmaticallyFocusInput(column.id);
  }
</script>

<div
  class="record-selector-table"
  class:has-open-nested-selector={activeColumnIsFk}
  class:loading={$isLoading}
>
  <div class="loading-spinner">
    <Spinner size="2em" />
  </div>
  <div class="row header" style="width: {rowWidth}px">
    <CellArranger {display} let:style let:processedColumn>
      <CellWrapper header {style}>
        <TableColumnName column={processedColumn} />
        <ColumnResizer columnId={processedColumn.column.id} />
      </CellWrapper>
    </CellArranger>
    <div class="overlay" />
  </div>

  <div class="row inputs" bind:this={inputsRow}>
    <CellArranger {display} let:style let:processedColumn let:columnId>
      {#if columnId === activeColumnId}
        {#if activeColumnIsFk}
          <div class="active-fk-cell-indicator" {style}>
            <div class="border" />
            <div class="knockout">
              <div class="smoother left"><QuarterCircle /></div>
              <div class="smoother right"><QuarterCircle /></div>
            </div>
            <div class="arrow"><Arrow /></div>
          </div>
        {:else}
          <div class="highlight" {style} />
        {/if}
      {/if}
      <CellWrapper
        style="{style}{columnId === activeColumnId ? 'z-index: 101;' : ''}"
      >
        <RecordSelectorInput
          class="record-selector-input column-{columnId}"
          containerClass="record-selector-input-container"
          componentAndProps={processedColumn.inputComponentAndProps}
          searchFuzzy={meta.searchFuzzy}
          {columnId}
          on:focus={() => handleInputFocus(columnId)}
          on:blur={() => handleInputBlur(columnId)}
          on:recordSelectorOpen={() => {
            activeColumnId = columnId;
          }}
          on:recordSelectorSubmit={() => {
            focusNextColumn(columnId);
            if (columnId === activeColumnId) {
              activeColumnId = undefined;
            }
          }}
          on:recordSelectorCancel={() => {
            if (columnId === activeColumnId) {
              activeColumnId = undefined;
            }
          }}
        />
      </CellWrapper>
    </CellArranger>
    <div class="overlay" />
  </div>

  <div class="divider">
    <CellArranger {display} let:style>
      <CellWrapper {style} divider />
    </CellArranger>
  </div>

  {#if $nestedSelectorIsOpen}
    <NestedRecordSelector />
  {:else}
    <RecordSelectorResults submit={handleSubmitRecord} />
  {/if}
</div>

<style>
  .record-selector-table {
    position: relative;
    --divider-height: 0.7rem;
    --divider-color: #e7e7e7;
    --color-highlight: #428af4;
  }
  .loading-spinner {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #aaa;
  }
  .record-selector-table:not(.loading) > .loading-spinner {
    display: none;
  }
  .row {
    position: relative;
    height: 30px;
  }
  .divider {
    position: relative;
    height: var(--divider-height);
    box-sizing: content-box;
  }
  .inputs :global(.record-selector-input-container) {
    height: 100%;
    width: 100%;
  }
  .inputs :global(.record-selector-input) {
    height: 100%;
    width: 100%;
    border: none;
  }
  .inputs :global(.record-selector-input:focus) {
    outline: none;
    border: none;
    box-shadow: none;
  }
  .highlight {
    position: absolute;
    height: 100%;
    z-index: 100;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--color-highlight);
    pointer-events: none;
  }
  .active-fk-cell-indicator {
    --border-width: 3px;
    position: absolute;
    height: 100%;
    z-index: 102;
    pointer-events: none;
  }
  .active-fk-cell-indicator .border {
    position: absolute;
    height: 100%;
    width: 100%;
    top: calc(-1 * var(--border-width));
    left: calc(-1 * var(--border-width));
    box-sizing: content-box;
    border: dashed var(--border-width) var(--color-highlight);
    z-index: 2;
  }
  .active-fk-cell-indicator .knockout {
    position: absolute;
    height: var(--divider-height);
    width: calc(100% + 2 * (var(--divider-height) + var(--border-width)));
    bottom: calc(-1 * var(--divider-height));
    left: calc(-1 * var(--border-width) + -1 * var(--divider-height));
    background: white;
    z-index: 1;
  }
  .active-fk-cell-indicator .smoother {
    position: absolute;
    color: var(--divider-color);
    height: var(--divider-height);
    width: var(--divider-height);
  }
  .active-fk-cell-indicator .smoother.right {
    right: 0;
    /* 1px forces some overlap to prevent sub-pixel gaps */
    transform: translate(1px) scaleX(-1);
  }
  .active-fk-cell-indicator :global(svg) {
    display: block;
    height: 100%;
    width: 100%;
  }
  .active-fk-cell-indicator .arrow {
    color: var(--color-highlight);
    position: absolute;
    --size: 1.2rem;
    width: var(--size);
    bottom: -1.5rem;
    left: calc(50% - var(--size) / 2);
    z-index: 3;
    transform: scaleY(-1);
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    z-index: 100;
    pointer-events: none;
  }
  .record-selector-table:not(.has-open-nested-selector) .overlay {
    display: none;
  }
</style>
