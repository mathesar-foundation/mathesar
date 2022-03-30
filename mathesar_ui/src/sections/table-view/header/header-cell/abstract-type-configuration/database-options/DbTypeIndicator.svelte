<script lang="ts">
  import type { DbType } from '@mathesar/App.d';

  export let selectedDbType: DbType | undefined;
</script>

<!-- TODO: Use common Indicator component after it is merged -->

<div>
  Database type <span>{selectedDbType ?? 'UNKNOWN'}</span>
</div>

<style lang="scss">
  div {
    margin-top: 15px;

    span {
      font-size: 0.8rem;
      padding: 0.2rem;
      font-weight: 500;
      background: #efefef;
    }
  }
</style>
