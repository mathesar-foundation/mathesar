<script lang="ts">
  import type QueryManager from './QueryManager';

  export let queryManager: QueryManager;

  $: ({ query, state } = queryManager);
</script>

<div class="result">
  {#if $query.initial_columns}
    {#each $query.initial_columns as column (column.alias)}
      Column: {column.column}:{column.alias}
    {/each}
  {/if}
</div>
