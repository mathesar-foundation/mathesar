<script lang="ts">
  import type { DbType } from '@mathesar/AppTypes';

  export let type: DbType | undefined;
</script>

<div>
  Database type <span>{type ?? 'UNKNOWN'}</span>
</div>

<style lang="scss">
  div {
    margin-top: 0.5rem;
    font-size: var(--text-size-small);

    span {
      text-transform: uppercase;
      background-color: var(--slate-200);
      border-radius: var(--border-radius-m);
      padding: 2px 4px;
      font-size: var(--text-size-x-small);
    }
  }
</style>
