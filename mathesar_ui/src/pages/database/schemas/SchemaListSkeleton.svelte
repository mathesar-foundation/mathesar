<script lang="ts">
  import { Skeleton } from '@mathesar/component-library';

  export let numTables = 4;

  $: skeletons = Array.from({ length: numTables }, (x, i) => i);
</script>

<div class="schema-skeleton-container">
  {#each skeletons as _ (_)}
    <div class="schema-skeleton">
      <Skeleton loading={true} />
    </div>
  {/each}
</div>

<style lang="scss">
  .schema-skeleton-container {
    display: grid;
    grid-gap: 1rem;
    --minimum-item-width: 18rem;
  }
  .schema-skeleton {
    position: relative;
    height: 7.5rem;
    border-radius: var(--border-radius-l);
    overflow: hidden;
  }
</style>
