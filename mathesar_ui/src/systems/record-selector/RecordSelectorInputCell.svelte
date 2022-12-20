<script lang="ts">
  import { onMount, tick } from 'svelte';
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

  let inputWrapper: HTMLElement;
  let searchValue = '';
  let textInput: HTMLInputElement | HTMLTextAreaElement | null;

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

  async function updateSearchValue() {
    await tick();
    searchValue = textInput?.value ?? '';
  }

  onMount(() => {
    textInput = inputWrapper.querySelector('input[type=text], textarea');
  });
</script>

<CellWrapper
  rowType="searchInputRow"
  columnType="dataColumn"
  {state}
  {overflowDetails}
>
  <div class="input-wrapper" bind:this={inputWrapper}>
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
        on:input={(e) => {
          void updateSearchValue();
          handleNewValue({ value: getValueFromEvent(e), debounce: true });
        }}
        on:artificialInput={(e) => {
          void updateSearchValue();
          handleNewValue({
            value: getValueFromArtificialEvent(e),
            debounce: true,
          });
        }}
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
    {#if searchValue}
      <div class="search-value">{searchValue}</div>
    {/if}
  </div>
</CellWrapper>

<style lang="scss">
  .input-wrapper {
    --padding: 0.6rem 0.4rem;

    :global(.record-selector-input) {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      color: inherit;
    }
    :global(input),
    :global(textarea) {
      line-height: 1;
      border-radius: 0;
      padding: var(--padding);
    }
    :global(.linked-record-input) {
      position: static;
      min-width: 100%;
      width: max-content;
      max-width: 100%;
    }
    :global(.record-selector-input:focus) {
      border: none;
      outline: none;
      box-shadow: none;
    }
    .search-value {
      padding: var(--padding);
      overflow: hidden;
      line-height: 1;
      background: tan;
      white-space: nowrap;
    }
  }
</style>
