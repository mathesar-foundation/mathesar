<script lang="ts">
  export let totalCount: number;
  export let selectedEntries: string[];
</script>

<div class="status-pane">
  <div class="record-count">
    {#if selectedEntries?.length > 0}
      {selectedEntries.length} record{selectedEntries.length > 1 ? 's' : ''} selected

    {:else if totalCount}
      {totalCount} record{totalCount > 1 ? 's' : ''}
    {/if}
  </div>
</div>
