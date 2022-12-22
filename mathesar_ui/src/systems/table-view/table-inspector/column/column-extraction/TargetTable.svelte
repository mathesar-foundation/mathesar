<script lang="ts">
  import TableName from '@mathesar/components/TableName.svelte';

  export let name: string | undefined = undefined;
</script>

{#if name}
  <TableName table={{ name }} truncate={false} bold />
{:else}
  the new table
{/if}
