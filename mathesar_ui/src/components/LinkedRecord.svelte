<script lang="ts">
  export let primaryKeyCellValue: unknown;
  export let label: string | undefined = undefined;
</script>

<span class="linked-record">
  {#if label !== undefined}
    {label}
  {:else}
    {String(primaryKeyCellValue)}
  {/if}
</span>

<style>
  .linked-record {
    background: #dfd0b3;
    padding: 0.2em 0.4em;
    border-radius: 0.2em;
  }
</style>
