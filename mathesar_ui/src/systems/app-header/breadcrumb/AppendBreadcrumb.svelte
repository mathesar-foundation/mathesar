<script lang="ts">
  import { onMount } from 'svelte';

  import type { BreadcrumbItem } from './breadcrumbTypes';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';

  export let item: BreadcrumbItem;
  const items = getBreadcrumbItemsFromContext();

  onMount(() => {
    console.log('AppendBreadcrumb being mounted ' + item.type);
    $items = [...$items, item];
    return () => {
      console.log('AppendBreadcrumb being unmounted ' + item.type);
      $items = $items.slice(0, -1);
    };
  });
</script>
