<script lang="ts">
  import { onDestroy } from 'svelte';

  import type { BreadcrumbItem } from './breadcrumbTypes';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';

  export let item: BreadcrumbItem;
  const items = getBreadcrumbItemsFromContext();

  /** `item` as it was before the most recent reactive update */
  let previousItem: BreadcrumbItem | undefined;

  function removeItemAtEnd() {
    $items = $items.slice(0, -1);
  }

  function removePreviousItem() {
    $items = $items.filter((i) => i !== previousItem);
  }

  function handleItemChange(i: BreadcrumbItem) {
    removePreviousItem();
    $items = [...$items, i];
    previousItem = item;
  }

  $: handleItemChange(item);

  onDestroy(removeItemAtEnd);
</script>
