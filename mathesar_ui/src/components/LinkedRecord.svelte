<script lang="ts">
  export let recordId: unknown;
  export let recordSummary: string | undefined = undefined;
</script>

<span class="linked-record">
  {recordSummary ?? String(recordId)}
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
    box-sizing: content-box;
  }
</style>
