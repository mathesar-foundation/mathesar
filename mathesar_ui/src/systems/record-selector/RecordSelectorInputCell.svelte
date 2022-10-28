<script lang="ts">
  import type { Writable } from 'svelte/store';

  import {
    Debounce,
    getValueFromArtificialEvent,
    getValueFromEvent,
  } from '@mathesar-component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import type {
    ProcessedColumn,
    SearchFuzzy,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import type { OverflowDetails } from '@mathesar/utils/overflowObserver';
  import CellWrapper from './RecordSelectorCellWrapper.svelte';
  import { getCellState } from './recordSelectorUtils';

  export let processedColumn: ProcessedColumn;
  export let searchFuzzy: Writable<SearchFuzzy>;
  export let recordSummaryStore: RecordSummaryStore;
  export let hasFocus: boolean;
  export let hasNestedSelectorOpen: boolean;
  export let overflowDetails: OverflowDetails | undefined = undefined;

  $: ({ column } = processedColumn);
  $: value = $searchFuzzy.get(column.id);
  $: recordSummary = $recordSummaryStore
    .get(String(column.id))
    ?.get(String(value));
  $: state = getCellState({ hasFocus, hasNestedSelectorOpen });

  function updateValue(e: CustomEvent<unknown>) {
    const newValue = e.detail;
    searchFuzzy.update((s) => s.with(column.id, newValue));
  }
</script>

<CellWrapper
  rowType="searchInputRow"
  columnType="dataColumn"
  {state}
  {overflowDetails}
>
  <Debounce on:artificialChange={updateValue} let:handleNewValue>
    <DynamicInput
      class="record-selector-input column-{column.id}"
      componentAndProps={processedColumn.inputComponentAndProps}
      {value}
      {recordSummary}
      allowsHyperlinks={false}
      setRecordSummary={(recordId, _recordSummary) =>
        recordSummaryStore.addBespokeRecordSummary({
          columnId: String(column.id),
          recordId,
          recordSummary: _recordSummary,
        })}
      on:input={(e) =>
        handleNewValue({ value: getValueFromEvent(e), debounce: true })}
      on:artificialInput={(e) =>
        handleNewValue({
          value: getValueFromArtificialEvent(e),
          debounce: true,
        })}
      on:change={(e) =>
        handleNewValue({ value: getValueFromEvent(e), debounce: false })}
      on:artificialChange={(e) =>
        handleNewValue({
          value: getValueFromArtificialEvent(e),
          debounce: false,
        })}
      on:focus
      on:blur
      on:recordSelectorOpen
      on:recordSelectorSubmit
      on:recordSelectorCancel
    />
  </Debounce>
</CellWrapper>

<style>
  :global(.record-selector-input) {
    height: 100%;
    width: 100%;
    border: none;
  }
  :global(.record-selector-input:focus) {
    outline: none;
    border: none;
    box-shadow: none;
  }
</style>
