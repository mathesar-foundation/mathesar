<script lang="ts">
  import LogoAndNameWithLink from '@mathesar/components/LogoAndNameWithLink.svelte';

  import BreadcrumbItemUi from './BreadcrumbItem.svelte';
  import type { BreadcrumbItem } from './breadcrumbTypes';
  import DatabaseSelector from './DatabaseSelector.svelte';

  export let items: BreadcrumbItem[];
  export let compactLayout = false;
</script>

<div class="breadcrumb">
  <LogoAndNameWithLink href="/" {compactLayout} />
  <DatabaseSelector />
  {#each items as item}
    <BreadcrumbItemUi {item} />
  {/each}
</div>

<style lang="scss">
  .breadcrumb {
    --breadcrumb-spacing: var(--sm5);
    display: flex;
    overflow: hidden;
    align-items: center;

    > :global(* + *) {
      margin-left: var(--breadcrumb-spacing);
    }
  }
</style>
