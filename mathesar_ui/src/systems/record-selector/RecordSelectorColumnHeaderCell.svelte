<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { Writable } from 'svelte/store';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type {
    ProcessedColumn,
    SearchFuzzy,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import type { OverflowDetails } from '@mathesar/utils/overflowObserver';
  import {
    Debounce,
    Label,
    LabelController,
    getValueFromArtificialEvent,
    getValueFromEvent,
  } from '@mathesar-component-library';

  import Cell from './RecordSelectorCellWrapper.svelte';

  const labelController = new LabelController();

  export let processedColumn: ProcessedColumn;
  export let searchFuzzy: Writable<SearchFuzzy>;
  export let recordSummaryStore: RecordSummaryStore;
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

<Cell
  rowType="columnHeaderRow"
  columnType="dataColumn"
  {overflowDetails}
  showAboveOverlay={hasNestedSelectorOpen}
>
  <div
    class="column-header-cell"
    class:has-nested-selector-open={hasNestedSelectorOpen}
  >
    <Label controller={labelController}>
      <ProcessedColumnName {processedColumn} />
    </Label>
    <div class="input-wrapper" bind:this={inputWrapper}>
      <div class="search-value">{searchValue}</div>
      <Debounce on:artificialChange={updateValue} let:handleNewValue>
        <DynamicInput
          class="record-selector-input column-{column.id}"
          componentAndProps={processedColumn.inputComponentAndProps}
          {value}
          {recordSummary}
          {labelController}
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
    </div>
    {#if hasNestedSelectorOpen}
      <div class="overlay" />
    {/if}
  </div>
</Cell>

<style>
  .column-header-cell {
    --input-height: 2.25rem;
    --padding: var(--sm4);
    padding: var(--padding);
    height: 100%;
    display: grid;
    grid-template: auto var(--input-height) / auto;
    gap: 0.5rem;
    position: relative;
    isolation: isolate;
  }
  .search-value {
    padding: 0 0.6rem;
    visibility: hidden;
    overflow: hidden;
    line-height: 1;
    white-space: nowrap;
    max-width: var(--max-column-width);
  }
  .column-header-cell :global(.record-selector-input) {
    position: absolute;
    bottom: var(--padding);
    height: var(--input-height);
    max-height: var(--input-height);
    left: var(--padding);
    width: calc(100% - 2 * var(--padding));
    background: var(--input-background);
    border-radius: 0.2rem;
    border: none;
    box-shadow: 0 0 0 0.1rem var(--neutral-200);
    outline: none;
    resize: none;
    color: var(--text-color);
    scrollbar-width: none;
  }
  .column-header-cell :global(.record-selector-input::-webkit-scrollbar) {
    display: none;
  }
  .column-header-cell.has-nested-selector-open :global(.record-selector-input) {
    box-shadow: 0 0 0 0.2rem var(--neutral-400);
    z-index: 2;
    pointer-events: none;
  }
  .column-header-cell :global(input),
  .column-header-cell :global(textarea) {
    line-height: 1;
    padding: 0.6rem 0.4rem;
    color: var(--text-color);
  }
  .column-header-cell :global(.linked-record-input) {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    padding: 0 var(--sm4);
    min-width: 100%;
    width: max-content;
    max-width: 100%;
  }
  .column-header-cell :global(.record-selector-input:focus) {
    border: none;
    outline: 0.2rem solid var(--outline-color);
  }
  .overlay {
    position: absolute;
    top: calc(-1 * var(--border-width));
    left: 0;
    right: calc(-1 * var(--border-width));
    bottom: calc(-1 * var(--separator-width));
    background: var(--shadow-color);
    z-index: 1;
  }

  :global(body.theme-dark) .column-header-cell :global(.record-selector-input) {
    box-shadow: 0 0 0 0.1rem var(--neutral-700);
  }

  :global(body.theme-dark)
    .column-header-cell.has-nested-selector-open
    :global(.record-selector-input) {
    box-shadow: 0 0 0 0.2rem var(--neutral-600);
  }
</style>
