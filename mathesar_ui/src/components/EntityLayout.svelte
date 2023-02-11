<script lang="ts">
  import OnPageFilterBar from '@mathesar/components/OnPageFilterBar.svelte';

  export let searchPlaceholder: string;
  export let searchQuery: string;
</script>

<div class="container">
  <OnPageFilterBar placeholder={searchPlaceholder} bind:searchQuery on:clear>
    <slot name="action" slot="action" />
    <slot slot="resultInfo" name="resultInfo" />
  </OnPageFilterBar>
  <slot name="content" />
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
