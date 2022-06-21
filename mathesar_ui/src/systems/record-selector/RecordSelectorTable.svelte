<script lang="ts">
  import { writable } from 'svelte/store';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import type { Row } from '@mathesar/stores/table-data/records';
  import { getProcessedColumnsMap } from '@mathesar/sections/table-view/utils';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  import ColumnResizer from '@mathesar/sections/table-view/header/header-cell/ColumnResizer.svelte';
  import DataTypeBasedInput from '@mathesar/components/cell/DataTypeBasedInput.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import CellArranger from './CellArranger.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;

  const tabularDataStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataStore);

  $: tabularDataStore.set(tabularData);
  $: ({ columnsDataStore, constraintsDataStore, display } = tabularData);
  $: ({ columns } = $columnsDataStore);
  $: pkColumn = columns.find((c) => c.primary_key);
  $: processedTableColumnsMap = getProcessedColumnsMap(
    $columnsDataStore.columns,
    $constraintsDataStore.constraints,
    $currentDbAbstractTypes.data,
  );

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
</script>

<div class="record-selector-table">
  <div class="row">
    <CellArranger
      {processedTableColumnsMap}
      {display}
      let:style
      let:processedColumn
    >
      <div class="cell column-header" {style}>
        <ColumnName column={processedColumn.column} />
        <ColumnResizer columnId={processedColumn.column.id} />
      </div>
    </CellArranger>
  </div>

  <div class="row inputs">
    <CellArranger
      {processedTableColumnsMap}
      {display}
      let:style
      let:processedColumn
    >
      <div class="cell" {style}>
        <DataTypeBasedInput column={processedColumn.column} value={null} />
      </div>
    </CellArranger>
  </div>

  <div class="divider">
    <CellArranger {processedTableColumnsMap} {display} let:style>
      <div class="cell" {style} />
    </CellArranger>
  </div>

  <RecordSelectorResults
    {processedTableColumnsMap}
    submit={handleSubmitRecord}
  />
</div>

<style>
  @import './Cell.scss';

  .row {
    position: relative;
    height: 30px;
  }

  .divider {
    position: relative;
    height: 10px;
    box-sizing: content-box;
  }
  .divider .cell {
    background: #e7e7e7;
  }

  .column-header {
    background: #f7f8f8;
    border-top: var(--cell-border-horizontal);
    /**
     * Padding is chosen to match `button.dropdown.trigger`. It would be good to
     * eliminate this code duplication somehow.
     */
    padding: 5px 26px 5px 12px;
  }

  .inputs {
    overflow: hidden;
  }
</style>
