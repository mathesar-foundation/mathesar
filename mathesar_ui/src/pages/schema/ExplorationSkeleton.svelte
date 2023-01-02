<script lang="ts">
  import { Skeleton } from '@mathesar/component-library';
</script>

<div class="exploration-skeleton-container">
  <Skeleton loading={true} />
</div>

<style lang="scss">
  .exploration-skeleton-container {
    border-radius: var(--border-radius-l);
    overflow: hidden;
    position: relative;
    height: 15rem;
  }
</style>
