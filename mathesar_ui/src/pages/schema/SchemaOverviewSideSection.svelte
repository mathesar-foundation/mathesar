<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  import OverviewItemSkeleton from './OverviewItemSkeleton.svelte';

  export let isLoading: boolean;
  export let hasError: boolean;
</script>

<section>
  <header>
    <h2>
      <slot name="header" />
    </h2>
    <div>
      <slot name="actions" />
    </div>
  </header>
  {#if isLoading}
    <OverviewItemSkeleton />
  {:else if hasError}
    <ErrorBox>
      <slot name="errors" />
    </ErrorBox>
  {:else}
    <slot name="content" />
  {/if}
</section>

<style lang="scss">
  header {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--lg1);

    h2 {
      margin: 0;
    }

    & > :global(:last-child) {
      flex-grow: 1;
      text-align: right;
    }
  }
</style>
