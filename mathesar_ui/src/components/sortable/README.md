# Sortable

> **Note**
>
> We'd like to move this code into its own package at some point, which is why it has no imports.

This is a set of Svelte actions which make it easy to add drag-and-drop sorting to UI elements.

## Usage

1. Apply the `sortableContainer` action to the container element which contains the items you want to sort. This action takes two arguments:

   - `getItems` — a function which returns the items to be sorted
   - `onSort` — a function which is called when the user drops an item, with the new sorted items as its argument. Use this to update your data.

1. Apply the `sortableItem` action to each item you want to be sortable.

   These items must be descendants of the `sortableContainer` element.

1. Apply the `sortableTrigger` action to the element which the user should drag to sort the item.

   This element can be the same as the `sortableItem` element or a descendant of it.

```svelte
<script>
  import { sortableContainer, sortableItem, sortableTrigger } from 'sortable';
</script>

<div
  use:sortableContainer={{
    getItems: () => items,
    onSort: (newItems) => {
      items = newItems;
    },
  }}
>
  {#each items as item}
    <div use:sortableItem>
      <div use:sortableTrigger>(trigger UI here)</div>
      (more complex per-item UI here)
    </div>
  {/each}
</div>

<style lang="scss">
  @import '/src/components/sortable/sortable.css';
</style>
```

## Features

- ✅ Actions-only API — no components and easy to style to your liking
- ✅ Sortable trigger is defined separately from the sortable item, making drag handles possible within more complex UIs
- ✅ Touch support
- ✅ Animated transitions while sorting
- ✅ Sort preview is done in pure CSS without manipulating the DOM before the sort is confirmed
- ✅ No dependencies

## Current limitations

(Improvements welcome!)

- Vertical sorting only
- No support for nested sorting containers
- Data cannot be updated in realtime while the user is dragging an item — updates are only applied when the user drops the item
- No transitions after the user drops an item
- Touch support is restricted to one touch at a time
- The browser must support [pointer events](https://caniuse.com/pointer)
