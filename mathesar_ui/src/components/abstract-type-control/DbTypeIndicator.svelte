<script lang="ts">
  import type { DbType } from '@mathesar/AppTypes';

  export let type: DbType | undefined;
</script>

<div>
  Database type: <span>{type ?? 'UNKNOWN'}</span>
</div>

<style lang="scss">
  div {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--color-gray-dark);

    span {
      font-weight: 500;
    }
  }
</style>
