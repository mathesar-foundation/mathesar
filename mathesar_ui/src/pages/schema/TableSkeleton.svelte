<script lang="ts">
  import { Skeleton } from '@mathesar/component-library';

  $: skeletalTables = [1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<div class="table-skeleton-container">
  {#each skeletalTables as skeletalTable}
    <div class="table-skeleton">
      <Skeleton loading={true} />
    </div>
  {/each}
</div>

<style lang="scss">
  .table-skeleton-container {
    display: grid;
    grid-gap: 1rem;
    --minimum-item-width: 18rem;
  }
  @supports (width: min(var(--minimum-item-width), 100%)) {
    .table-skeleton-container {
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(var(--minimum-item-width), 100%), 1fr)
      );
    }
  }
  .table-skeleton {
    position: relative;
    height: 7.5rem;
    border-radius: var(--border-radius-l);
    overflow: hidden;
  }
</style>
