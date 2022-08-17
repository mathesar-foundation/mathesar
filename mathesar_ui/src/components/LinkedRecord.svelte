<script lang="ts">
  export let recordId: unknown;
  export let label: string | undefined = undefined;
</script>

<span class="linked-record">
  {#if label !== undefined}
    {label}
  {:else}
    {String(recordId)}
  {/if}
</span>

<style>
  .linked-record {
    background: var(--color-fk);
    padding: 0.1rem 0.4rem;
    border-radius: 0.25rem;
    display: block;
    max-width: max-content;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
