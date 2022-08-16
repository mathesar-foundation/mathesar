<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { ComponentAndProps } from '@mathesar/component-library/types';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import type { SearchFuzzy } from '@mathesar/stores/table-data/searchFuzzy';
  import { Debounce } from '@mathesar/component-library';

  let classes = '';
  export { classes as class };
  export let containerClass: string | undefined;
  export let columnId: number;
  export let componentAndProps: ComponentAndProps;
  export let searchFuzzy: Writable<SearchFuzzy>;

  $: value = $searchFuzzy.get(columnId);

  function updateValue(e: CustomEvent<unknown>) {
    const newValue = e.detail;
    searchFuzzy.update((s) => s.with(columnId, newValue));
  }
</script>

<Debounce
  on:artificialChange={updateValue}
  let:artificialInput
  let:input
  let:artificialChange
  let:change
>
  <DynamicInput
    class={classes}
    {containerClass}
    {componentAndProps}
    {value}
    on:input={input}
    on:artificialInput={artificialInput}
    on:change={change}
    on:artificialChange={artificialChange}
    on:focus
    on:blur
    on:recordSelectorOpen
    on:recordSelectorSubmit
    on:recordSelectorCancel
  />
</Debounce>
