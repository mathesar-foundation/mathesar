<script lang="ts">
  import BreadcrumbItem from './BreadcrumbItem.svelte';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';
  import DatabaseSelector from './DatabaseSelector.svelte';
  import LogoAndNameWithLink from './LogoAndNameWithLink.svelte';

  const items = getBreadcrumbItemsFromContext();

  /**
   * When we have lots of items, tell each one that they can simplify
   * themselves on narrow viewports.
   */
  $: hasResponsiveAbridgement = $items.length > 2;
</script>

<div class="breadcrumb">
  <LogoAndNameWithLink href="/" {hasResponsiveAbridgement} />
  <DatabaseSelector />
  {#each $items as item}
    <BreadcrumbItem {item} />
  {/each}
</div>

<style lang="scss">
  .breadcrumb {
    --breadcrumb-spacing: 0.75rem;
    display: flex;
    overflow: hidden;
    align-items: center;

    > :global(* + *) {
      margin-left: var(--breadcrumb-spacing);
    }
  }
</style>
