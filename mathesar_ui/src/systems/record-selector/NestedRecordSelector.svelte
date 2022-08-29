<script lang="ts">
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import { getRecordSelectorFromContext } from './RecordSelectorController';
  import RecordSelectorTitle from './RecordSelectorTitle.svelte';

  const controller = getRecordSelectorFromContext();

  $: ({ tableId } = controller);
</script>

{#if $tableId}
  <div class="title">
    <RecordSelectorTitle tableId={$tableId} />
  </div>
{/if}
<RecordSelectorContent {controller} />

<style>
  .title {
    font-weight: bold;
    padding: 0.8rem;
  }
</style>
