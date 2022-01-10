<script lang="ts">
  import Null from './Null.svelte';

  export let value: unknown;
</script>

{#if value === null}
  <Null />
{:else}
  {value}
{/if}
