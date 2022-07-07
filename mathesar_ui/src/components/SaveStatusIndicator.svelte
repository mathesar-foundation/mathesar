<script lang="ts">
  export let status: 'new' | 'processing' | 'success' | 'failure' | undefined;
</script>

<div
  class="save-status"
  class:new={status === 'new'}
  class:saved={status === 'success'}
  class:saving={status === 'processing'}
  class:error={status === 'failure'}
>
  {#if status === 'new'}
    *Unsaved
  {:else if status === 'success'}
    All changes saved
  {:else if status === 'processing'}
    Saving changes...
  {:else if status === 'failure'}
    ! Couldn't save changes
  {/if}
</div>

<style lang="scss">
  .save-status {
    font-size: 0.9em;
    color: #888;

    &.error {
      color: #f47171;
    }
  }
</style>
