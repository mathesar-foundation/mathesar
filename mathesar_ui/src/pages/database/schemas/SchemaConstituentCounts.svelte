<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/models/Schema';

  export let schema: Schema;

  $: ({ tableCount } = schema);
  $: actualTableCount = $tableCount;
</script>

<div class="container">
  <p class="table-count">
    {actualTableCount}
  </p>
</div>

<style lang="scss">
  .table-count {
    font-size: var(--text-size-base);
    color: var(--text-color-tertiary);
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
