<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { DbType } from '@mathesar/AppTypes';

  export let type: DbType | undefined;
</script>

<div>
  {$_('database_type')}: <span>{type ?? 'UNKNOWN'}</span>
</div>

<style lang="scss">
  div {
    margin-top: 0.5rem;
    font-size: var(--sm1);

    span {
      text-transform: uppercase;
      background-color: var(--surface-raised-3-background);
      border-radius: var(--border-radius-m);
      padding: 2px 4px;
      font-size: var(--sm2);
      font-weight: var(--font-weight-bold);
    }
  }
</style>
