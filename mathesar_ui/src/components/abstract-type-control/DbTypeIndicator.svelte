<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ColumnTypeOptions } from '@mathesar/api/rpc/columns';
  import type { DbType } from '@mathesar/AppTypes';
  import { DB_TYPES } from '@mathesar/stores/abstract-types/dbTypes';

  export let type: DbType | undefined;
  export let typeOptions: ColumnTypeOptions | null | undefined = undefined;

  $: itemType = typeOptions?.item_type;
  $: originalType = typeOptions?.original_type;
</script>

<div>
  {$_('database_type')}:
  {#if type === DB_TYPES.ARRAY && itemType}
    <span>{itemType}[]</span>
  {:else if type === DB_TYPES.ENUM && originalType}
    <span>{originalType}</span>
  {:else}
    <span>{type ?? 'UNKNOWN'}</span>
  {/if}
</div>

<style lang="scss">
  div {
    margin-top: 0.5rem;
    font-size: var(--sm1);

    span {
      text-transform: uppercase;
      background-color: var(--color-bg-raised-3);
      border-radius: var(--border-radius-m);
      padding: 2px 4px;
      font-size: var(--sm2);
      font-weight: var(--font-weight-bold);
    }
  }
</style>
