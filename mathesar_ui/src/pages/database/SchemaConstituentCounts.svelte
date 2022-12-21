<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';

  export let schema: SchemaEntry;
</script>

<div class="container">
  <p class="constituent">
    {schema.num_tables} Table{schema.num_tables > 0 ? 's' : ''}
  </p>
  <span class="divider" />
  <p class="constituent">
    {schema.num_queries} Exploration{schema.num_queries > 0 ? 's' : ''}
  </p>
</div>

<style lang="scss">
  .constituent {
    font-size: var(--text-size-base);
    font-weight: 400;
  }

  .container {
    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }

  .divider {
    width: 4px;
    height: 4px;
    background-color: var(--slate-500);
    border-radius: var(--border-radius-m);
  }
</style>
