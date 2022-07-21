<script lang="ts">
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  export let controller: RecordSelectorController;

  $: ({ tabularData } = controller);
</script>

{#if $tabularData}
  <RecordSelectorTable tabularData={$tabularData} {controller} />
{/if}
