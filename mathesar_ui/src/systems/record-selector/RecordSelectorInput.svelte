<script lang="ts">
  import type { Writable } from 'svelte/store';

  import {
    Debounce,
    getValueFromArtificialEvent,
    getValueFromEvent,
  } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import type { SearchFuzzy } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';

  let classes = '';
  export { classes as class };
  export let containerClass: string | undefined;
  export let columnId: number;
  export let componentAndProps: ComponentAndProps;
  export let searchFuzzy: Writable<SearchFuzzy>;
  export let recordSummaryStore: RecordSummaryStore;

  $: value = $searchFuzzy.get(columnId);
  $: recordSummary = $recordSummaryStore
    .get(String(columnId))
    ?.get(String(value));

  function updateValue(e: CustomEvent<unknown>) {
    const newValue = e.detail;
    searchFuzzy.update((s) => s.with(columnId, newValue));
  }
</script>

<Debounce on:artificialChange={updateValue} let:handleNewValue>
  <DynamicInput
    class={classes}
    {containerClass}
    {componentAndProps}
    {value}
    {recordSummary}
    setRecordSummary={(recordId, recordSummary) =>
      recordSummaryStore.addBespokeRecordSummary({
        columnId: String(columnId),
        recordId,
        recordSummary,
      })}
    on:input={(e) =>
      handleNewValue({ value: getValueFromEvent(e), debounce: true })}
    on:artificialInput={(e) =>
      handleNewValue({ value: getValueFromArtificialEvent(e), debounce: true })}
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
