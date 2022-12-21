<script lang="ts">
  export let status:
    | 'unsaved'
    | 'processing'
    | 'success'
    | 'failure'
    | undefined;
</script>

{#if status}
  <div
    class="save-status"
    class:unsaved={status === 'unsaved'}
    class:saved={status === 'success'}
    class:saving={status === 'processing'}
    class:error={status === 'failure'}
  >
    {#if !status}
      *Has unsaved changes
    {:else if status === 'success'}
      All changes saved
    {:else if status === 'processing'}
      Saving changes...
    {:else if status === 'failure'}
      ! Couldn't save changes
    {/if}
  </div>
{/if}

<style lang="scss">
  .save-status {
    color: var(--slate-300);

    &.error {
      color: var(--color-error);
    }
  }
</style>
