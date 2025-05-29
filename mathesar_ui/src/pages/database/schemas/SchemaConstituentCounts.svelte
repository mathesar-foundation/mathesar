<script lang="ts">
  import type { Schema } from '@mathesar/models/Schema';

  export let schema: Schema;

  $: ({ tableCount } = schema);
  $: actualTableCount = $tableCount;
  $: tableText = actualTableCount === 1 ? 'table' : 'tables';
</script>

<div class="container">
  <p class="table-count">
    {actualTableCount}
    {tableText}
  </p>
</div>

<style lang="scss">
  .table-count {
    font-size: 1rem;
    color: var(--text-color-tertiary);
    font-weight: var(--font-weight-medium);
    margin: 0;
  }

  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }
</style>
