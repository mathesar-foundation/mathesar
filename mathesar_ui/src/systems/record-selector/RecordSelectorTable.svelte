<script lang="ts">
  import { writable } from 'svelte/store';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import type { Row } from '@mathesar/stores/table-data/records';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  // TODO: Remove route dependency in systems
  import { getProcessedColumnsMap } from '@mathesar/routes/schema-home/routes/datascape/table-view/utils';
  import ColumnResizer from '@mathesar/routes/schema-home/routes/datascape/table-view/header/header-cell/ColumnResizer.svelte';
  import DataTypeBasedInput from '@mathesar/components/cell/DataTypeBasedInput.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';

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
      <CellWrapper header {style}>
        <ColumnName column={processedColumn.column} />
        <ColumnResizer columnId={processedColumn.column.id} />
      </CellWrapper>
    </CellArranger>
  </div>

  <div class="row inputs">
    <CellArranger
      {processedTableColumnsMap}
      {display}
      let:style
      let:processedColumn
    >
      <CellWrapper {style}>
        <DataTypeBasedInput column={processedColumn.column} value={null} />
      </CellWrapper>
    </CellArranger>
  </div>

  <div class="divider">
    <CellArranger {processedTableColumnsMap} {display} let:style>
      <CellWrapper {style} divider />
    </CellArranger>
  </div>

  <RecordSelectorResults
    {processedTableColumnsMap}
    submit={handleSubmitRecord}
  />
</div>

<style>
  .row {
    position: relative;
    height: 30px;
  }
  .divider {
    position: relative;
    height: 10px;
    box-sizing: content-box;
  }
  .inputs {
    overflow: hidden;
  }
</style>
