<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';

  export let schema: Schema;
</script>

<div class="container">
  <p class="table-count">
    {$_('count_tables', { values: { count: schema.table_count } })}
  </p>
</div>

<style lang="scss">
  .table-count {
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
</style>
