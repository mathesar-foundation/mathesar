<script lang="ts">
  import { Skeleton } from '@mathesar/component-library';
</script>

<div class="connection-skeleton-container">
  <Skeleton loading={true} />
</div>

<style lang="scss">
  .connection-skeleton-container {
    border-radius: var(--border-radius-m);
    overflow: hidden;
    position: relative;
    height: 15rem;
  }
</style>
