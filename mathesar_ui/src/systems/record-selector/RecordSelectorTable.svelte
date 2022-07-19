<script lang="ts">
  import { writable } from 'svelte/store';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import type { Row } from '@mathesar/stores/table-data/records';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  import DynamicInput from '@mathesar/components/cell/DynamicInput.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;

  const tabularDataStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataStore);

  $: tabularDataStore.set(tabularData);
  $: ({ columnsDataStore, display } = tabularData);
  $: ({ columns } = $columnsDataStore);
  $: pkColumn = columns.find((c) => c.primary_key);

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
    <CellArranger {display} let:style let:processedColumn>
      <CellWrapper header {style}>
        <ColumnName column={processedColumn.column} />
        <ColumnResizer columnId={processedColumn.column.id} />
      </CellWrapper>
    </CellArranger>
  </div>

  <div class="row inputs">
    <CellArranger {display} let:style let:processedColumn>
      <CellWrapper {style}>
        <DynamicInput
          componentAndProps={processedColumn.inputComponentAndProps}
          value={null}
        />
      </CellWrapper>
    </CellArranger>
  </div>

  <div class="divider">
    <CellArranger {display} let:style>
      <CellWrapper {style} divider />
    </CellArranger>
  </div>

  <RecordSelectorResults submit={handleSubmitRecord} />
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
