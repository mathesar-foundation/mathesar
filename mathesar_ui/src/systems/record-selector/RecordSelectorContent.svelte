<script lang="ts">
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  export let controller: RecordSelectorController;
  export let nestedController: RecordSelectorController | undefined = undefined;

  $: ({ tabularData } = controller);
</script>

{#if $tabularData}
  <RecordSelectorTable
    tabularData={$tabularData}
    {controller}
    bind:nestedController
  />
{/if}
