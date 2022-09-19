<script lang="ts">
  import { onDestroy } from 'svelte';

  import type { BreadcrumbItem } from './breadcrumbTypes';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';

  export let item: BreadcrumbItem;
  const items = getBreadcrumbItemsFromContext();

  let previousItem: BreadcrumbItem | undefined;

  function popLastItem() {
    $items = $items.slice(0, -1);
  }

  function popLastItemIfPrevious() {
    if (previousItem && $items[$items.length - 1] === previousItem) {
      popLastItem();
    }
  }

  function handleItemChange(i: BreadcrumbItem) {
    popLastItemIfPrevious();
    $items = [...$items, i];
    previousItem = item;
  }

  $: handleItemChange(item);

  onDestroy(popLastItem);
</script>
