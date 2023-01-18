<script lang="ts">
  import { onDestroy } from 'svelte';

  import type { BreadcrumbItem } from './breadcrumbTypes';
  import { getBreadcrumbItemsFromContext } from './breadcrumbUtils';

  export let item: BreadcrumbItem;
  const items = getBreadcrumbItemsFromContext();

  /** `item` as it was before the most recent reactive update */
  let previousItem: BreadcrumbItem | undefined;

  function removeItem() {
    $items = $items.filter((i) => i !== item);
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

  onDestroy(removeItem);
</script>
