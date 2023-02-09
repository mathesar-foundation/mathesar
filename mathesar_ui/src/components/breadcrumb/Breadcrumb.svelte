<script lang="ts">
  import BreadcrumbItem from './BreadcrumbItem.svelte';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';
  import LogoAndNameWithLink from './LogoAndNameWithLink.svelte';

  const items = getBreadcrumbItemsFromContext();

  $: showRoot = $items.every((i) => i.type !== 'database');
  /**
   * When we have lots of items, tell each one that they can simplify
   * themselves on narrow viewports.
   */
  $: hasResponsiveAbridgement = $items.length > 2;
</script>

<div class="breadcrumb">
  {#if showRoot}
    <LogoAndNameWithLink href="/" />
  {/if}
  {#each $items as item}
    <BreadcrumbItem {item} {hasResponsiveAbridgement} />
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
