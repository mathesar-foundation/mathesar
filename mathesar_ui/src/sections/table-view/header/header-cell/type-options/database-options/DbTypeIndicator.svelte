<script lang="ts">
  import type { DbType } from '@mathesar/App.d';

  export let selectedDbType: DbType;
</script>

<!-- TODO: Use common Indicator component after it is merged -->

<div>
  Database type <span>{selectedDbType}</span>
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
