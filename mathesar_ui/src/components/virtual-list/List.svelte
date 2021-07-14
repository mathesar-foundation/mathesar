<script lang="ts" context="module">
  /**
   * Forked from "react-window@1.8.6"
   * https://github.com/bvaughn/react-window
   * Copyright (c) 2018 Brian Vaughn
   *
   * Inspired by "svelte-window@1.2.3"
   * https://github.com/micha-lmxt/svelte-window
   * Copyright (c) 2021 Michael Lucht
   *
   * This fork contains the following changes:
   * 1. Ported to Svelte, TS
   * 2. Stripped down to vertical variable size list essentials
   */

  const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
  const DEFAULT_ESTIMATED_ITEM_SIZE = 32;
</script>

<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import { cancelTimeout, requestTimeout } from './timer';
  import listUtils from './listUtils';
  import type { Props } from './listUtils';

  let classes = 'default';
  export { classes as class };
  $: outerClass = ['virtual-list', 'outerElement', classes].join(' ');

  export let estimatedItemSize: number = DEFAULT_ESTIMATED_ITEM_SIZE;
  export let height: Props['height'];
  export let scrollOffset: Props['scrollOffset'] = 0;
  export let itemCount: Props['itemCount'];
  export let overscanCount: Props['overscanCount'] = 5;
  export let itemSize: Props['itemSize'] = () : number => estimatedItemSize;
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  
  let itemKey: Props['itemKey'];
  const instanceProps: Props['instanceProps'] = {
    lastMeasuredIndex: -1,
    itemMetadataMap: {},
    styleCache: {},
  };
  let isScrolling: Props['isScrolling'] = false;
  let scrollDirection : Props['scrollDirection'] = 'forward';

  let items = [];
  let estimatedTotalSize: number;

  let outerRef;
  let innerRef;

  let requestResetIsScrolling = false;
  let resetIsScrollingTimeoutId = null;

  let requestGetItemStyleCache = false;

  function recalc(opts: Props) {
    items = listUtils.getItems(opts);
    // Read this value AFTER items have been created,
    // So their actual sizes (if variable) are taken into consideration.
    estimatedTotalSize = listUtils.getEstimatedTotalSize(opts);
  }

  $: recalc({
    itemSize,
    instanceProps,
    isScrolling,
    scrollDirection,
    itemCount,
    overscanCount,
    scrollOffset,
    height,
    itemKey,
    estimatedItemSize,
  });

  onMount(() => {
    if (typeof scrollOffset === 'number' && outerRef) {
      outerRef.scrollTop = scrollOffset;
    }
  });

  const resetIsScrolling = () => {
    resetIsScrollingTimeoutId = null;
    isScrolling = false;
    requestGetItemStyleCache = true;
  };

  function resetIsScrollingDebounced() {
    if (resetIsScrollingTimeoutId !== null) {
      cancelTimeout(resetIsScrollingTimeoutId);
    }
    resetIsScrollingTimeoutId = requestTimeout(
      resetIsScrolling,
      IS_SCROLLING_DEBOUNCE_INTERVAL,
    );
  }

  // For updates that need to run after the tick, and dom is updated
  afterUpdate(() => {
    if (requestResetIsScrolling) {
      requestResetIsScrolling = false;
      resetIsScrollingDebounced();
    }
    if (requestGetItemStyleCache) {
      requestGetItemStyleCache = false;
      instanceProps.styleCache = {};
    }
  });

  onDestroy(() => {
    if (resetIsScrollingTimeoutId !== null) {
      cancelTimeout(resetIsScrollingTimeoutId);
    }
  });

  function onScroll(event: Event): void {
    const {
      clientHeight,
      scrollHeight,
      scrollTop,
      scrollLeft,
    } = event.currentTarget as HTMLElement;
    requestResetIsScrolling = true;
    horizontalScrollOffset = scrollLeft;

    // Scroll position may have been updated by cDM/cDU,
    // In which case we don't need to trigger another render,
    // And we don't want to update state.isScrolling.
    if (scrollOffset !== scrollTop) {
      // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
      const newScrollOffset = Math.max(
        0,
        Math.min(scrollTop, scrollHeight - clientHeight),
      );
      isScrolling = true;
      scrollDirection = scrollOffset < newScrollOffset ? 'forward' : 'backward';
      scrollOffset = newScrollOffset;
    }
  }
</script>

<div
  class={outerClass}
  style="height:{height}px;width:100%;direction:ltr;"
  bind:this={outerRef}
  on:scroll={onScroll}>
  <div
      bind:this={innerRef}
      style="height:{estimatedTotalSize + paddingBottom}px;{isScrolling ? 'pointer-events:none;' : ''}width:100%;">
      <slot {items} />
  </div>
</div>
