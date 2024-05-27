<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SchemaEntry } from '@mathesar/AppTypes';

  export let schema: SchemaEntry;
</script>

<div class="container">
  <p class="constituent">
    {$_('count_tables', { values: { count: schema.num_tables } })}
  </p>
  <span class="divider" />
  <p class="constituent">
    {$_('count_explorations', { values: { count: schema.num_queries } })}
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
