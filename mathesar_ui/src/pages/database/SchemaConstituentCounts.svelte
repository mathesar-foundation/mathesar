<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { labeledCount } from '@mathesar/utils/languageUtils';

  export let schema: SchemaEntry;
</script>

<div class="container">
  <p class="constituent">
    {labeledCount(schema.num_tables, 'tables')}
  </p>
  <span class="divider" />
  <p class="constituent">
    {labeledCount(schema.num_queries, 'explorations')}
  </p>
</div>

<style lang="scss">
  .constituent {
    font-size: var(--text-size-base);
    font-weight: 400;
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
  .divider {
    width: 4px;
    height: 4px;
    background-color: var(--slate-500);
    border-radius: var(--border-radius-m);
  }
</style>
