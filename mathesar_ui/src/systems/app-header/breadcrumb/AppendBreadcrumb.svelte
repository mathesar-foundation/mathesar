<script lang="ts">
  import { onMount } from 'svelte';

  import type { BreadcrumbItem } from './breadcrumbTypes';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';

  export let item: BreadcrumbItem;
  const items = getBreadcrumbItemsFromContext();

  onMount(() => {
    $items = [...$items, item];
    return () => {
      $items = $items.slice(0, -1);
    };
  });
</script>
