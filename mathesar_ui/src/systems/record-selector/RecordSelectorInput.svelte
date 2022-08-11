<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { ComponentAndProps } from '@mathesar/component-library/types';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import type { SearchFuzzy } from '@mathesar/stores/table-data/searchFuzzy';

  let classes = '';
  export { classes as class };
  export let containerClass: string | undefined;
  export let columnId: number;
  export let componentAndProps: ComponentAndProps;
  export let searchFuzzy: Writable<SearchFuzzy>;

  $: value = $searchFuzzy.get(columnId);
</script>

<DynamicInput
  class={classes}
  {containerClass}
  {componentAndProps}
  {value}
  onValueChange={(v) => searchFuzzy.update((s) => s.with(columnId, v))}
  on:focus
  on:blur
  on:recordSelectorOpen
  on:recordSelectorSubmit
  on:recordSelectorCancel
/>
