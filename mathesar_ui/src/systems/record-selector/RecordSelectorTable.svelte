<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  import type { Column } from '@mathesar/api/tables/columns';
  import type { Result as ApiRecord } from '@mathesar/api/tables/records';
  import { ImmutableMap, Spinner } from '@mathesar/component-library';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  import { constraintIsFk } from '@mathesar/stores/table-data/constraintsUtils';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  import { postAPI } from '@mathesar/utils/api';
  import Arrow from './Arrow.svelte';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import NestedRecordSelector from './NestedRecordSelector.svelte';
  import QuarterCircle from './QuarterCircle.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import { setNewRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInput from './RecordSelectorInput.svelte';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;

  let nestedRecordSelectorController =
    setNewRecordSelectorControllerInContext();
  export { nestedRecordSelectorController as nestedController };

  const tabularDataStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataStore);

  /**
   * The column (if any) which has focus.
   *
   * For non-FK cells, this value will be reset to `undefined` when the input
   * loses focus (e.g. clicking on blank space within the modal). But for FK
   * cells, this value will remain set to the FK column id while the nested
   * record selector is open.
   */
  let activeColumn: Column | undefined = undefined;
  let isSubmittingNewRecord = false;

  $: tabularDataStore.set(tabularData);
  $: ({ constraintsDataStore, display, meta, isLoading, columnsDataStore } =
    tabularData);
  $: ({ constraints } = $constraintsDataStore);
  $: nestedSelectorIsOpen = nestedRecordSelectorController.isOpen;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: ({ columns } = $columnsDataStore);

  /** keys are column ids, values are FK constraints */
  $: fkConstraintMap = new ImmutableMap(
    constraints
      .filter(constraintIsFk)
      .filter((c) => c.columns.length === 1)
      .map((c) => [c.columns[0], c]),
  );

  $: activeColumnIsFk =
    activeColumn === undefined
      ? false
      : fkConstraintMap.has(activeColumn.id) ?? false;

  function handleSubmitPkValue(v: string | number) {
    controller.submit(v);
  }

  async function handleSubmitNewRecord(v: Iterable<[number, unknown]>) {
    const url = `/api/db/v0/tables/${tabularData.id}/records/`;
    try {
      isSubmittingNewRecord = true;
      const record = await postAPI<ApiRecord>(url, Object.fromEntries(v));
      const pkValue = getPkValueInRecord(record, columns);
      controller.submit(pkValue);
    } catch (err) {
      // TODO set errors in tabularData to appear within cells
    } finally {
      isSubmittingNewRecord = false;
    }
  }

  function handleInputFocus(column: Column) {
    if (activeColumn !== column) {
      nestedRecordSelectorController.cancel();
    }
    activeColumn = column;
  }

  onMount(() => () => {
    activeColumn = undefined;
  });
</script>

<div
  class="record-selector-table"
  class:has-open-nested-selector={$nestedSelectorIsOpen}
>
  {#if $isLoading || isSubmittingNewRecord}
    <div
      class="loading-spinner"
      class:prevent-user-entry={isSubmittingNewRecord}
    >
      <Spinner size="2em" />
    </div>
  {/if}
  <div class="row header" style="width: {rowWidth}px">
    <CellArranger {display} let:style let:processedColumn>
      <CellWrapper header {style}>
        <TableColumnName column={processedColumn} />
        <ColumnResizer columnId={processedColumn.column.id} />
      </CellWrapper>
    </CellArranger>
    <div class="overlay" />
  </div>

  <div class="row inputs">
    <CellArranger {display} let:style let:processedColumn let:column>
      {#if column === activeColumn}
        {#if activeColumnIsFk && $nestedSelectorIsOpen}
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
        style="{style}{column === activeColumn ? 'z-index: 101;' : ''}"
      >
        <RecordSelectorInput
          class="record-selector-input column-{column.id}"
          containerClass="record-selector-input-container"
          componentAndProps={processedColumn.inputComponentAndProps}
          searchFuzzy={meta.searchFuzzy}
          columnId={column.id}
          on:focus={() => handleInputFocus(column)}
          on:blur={() => {
            activeColumn = undefined;
          }}
          on:recordSelectorOpen={() => {
            activeColumn = column;
          }}
          on:recordSelectorSubmit={() => {
            if (column === activeColumn) {
              activeColumn = undefined;
            }
          }}
          on:recordSelectorCancel={() => {
            if (column === activeColumn) {
              activeColumn = undefined;
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
    <RecordSelectorResults
      {activeColumn}
      {activeColumnIsFk}
      submitPkValue={handleSubmitPkValue}
      submitNewRecord={handleSubmitNewRecord}
    />
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
    z-index: 100;
    pointer-events: none;
  }
  .loading-spinner.prevent-user-entry {
    pointer-events: all;
    background: rgba(255, 255, 255, 0.5);
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
