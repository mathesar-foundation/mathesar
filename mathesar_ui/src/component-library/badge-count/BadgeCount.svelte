<script lang="ts">
  import Badge from '@mathesar-component-library-dir/badge/Badge.svelte';

  export let value: number;
</script>

{#if value > 0}
  <Badge>{value}</Badge>
{/if}
