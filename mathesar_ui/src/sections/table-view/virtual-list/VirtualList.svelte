<script lang="ts" context="module">
  /**
   * Ported from "react-window@1.8.6"
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
   * 3. Added perfect scrollbar, utilized it's event instead of native
   */

  const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
  const DEFAULT_ESTIMATED_ITEM_SIZE = 30;
</script>

<script lang="ts">
  import {
    createEventDispatcher,
    onMount,
    afterUpdate,
    onDestroy,
  } from 'svelte';
  import PerfectScrollbar from 'perfect-scrollbar';
  import { cancelTimeout, requestTimeout } from './timer';
  import listUtils from './listUtils';
  import type { Props, ItemInfo } from './listUtils';

  const dispatch = createEventDispatcher();

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
  export let itemKey: Props['itemKey'] = listUtils.defaultItemKey;
  
  let instanceProps: Props['instanceProps'] = {
    lastMeasuredIndex: -1,
    itemMetadataMap: {},
    styleCache: {},
  };
  let isScrolling: Props['isScrolling'] = false;
  let scrollDirection : Props['scrollDirection'] = 'forward';
  let lastHeight: Props['height'] = height;

  let items: ItemInfo['items'] = [];
  let estimatedTotalSize: number;

  let outerRef: HTMLElement;
  let innerRef;

  let requestResetIsScrolling = false;
  let resetIsScrollingTimeoutId = null;

  let requestGetItemStyleCache = false;
  let psRef: PerfectScrollbar = null;

  let itemInfo: ItemInfo;

  function recalc(opts: Props) {
    itemInfo = listUtils.getItemsInfo(opts);
    items = itemInfo.items;
    estimatedTotalSize = listUtils.getEstimatedTotalSize(opts);

    if (lastHeight !== height) {
      lastHeight = height;
      dispatch('refetch', itemInfo);
    }
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

  function onScroll(event: Event): void {
    const {
      clientHeight,
      scrollHeight,
      scrollTop,
      scrollLeft,
    } = event.target as HTMLElement;
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

  function onHorizontalScroll(event: Event): void {
    const {
      scrollLeft,
    } = event.target as HTMLElement;
    horizontalScrollOffset = scrollLeft;
  }

  onMount(() => {
    if (typeof scrollOffset === 'number' && outerRef) {
      outerRef.scrollTop = scrollOffset;
    }
    psRef = new PerfectScrollbar(outerRef, {
      minScrollbarLength: 40,
    });

    const callback = (ev: Event) => {
      onScroll(ev);
    };
    const hCallback = (ev: Event) => {
      onHorizontalScroll(ev);
    };

    dispatch('refetch', itemInfo);

    outerRef.addEventListener('ps-scroll-y', callback);
    outerRef.addEventListener('ps-scroll-x', hCallback);

    return (() => {
      outerRef.removeEventListener('ps-scroll-y', callback);
      outerRef.removeEventListener('ps-scroll-x', hCallback);
      psRef.destroy();
    });
  });

  const scrollStopped = () => {
    resetIsScrollingTimeoutId = null;
    isScrolling = false;
    requestGetItemStyleCache = true;
    dispatch('refetch', itemInfo);
  };

  function resetIsScrollingDebounced() {
    if (resetIsScrollingTimeoutId !== null) {
      cancelTimeout(resetIsScrollingTimeoutId);
    }
    resetIsScrollingTimeoutId = requestTimeout(
      scrollStopped,
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
    if (psRef) {
      psRef.update();
    }
  });

  onDestroy(() => {
    if (resetIsScrollingTimeoutId !== null) {
      cancelTimeout(resetIsScrollingTimeoutId);
    }
  });

  export function resetAfterIndex(index: number): void {
    instanceProps = {
      ...instanceProps,
      lastMeasuredIndex: Math.min(
        instanceProps.lastMeasuredIndex,
        index - 1,
      ),
      styleCache: {},
    };
  }

  export function scrollToPosition(
    _scrollOffset: number,
    _horizontalScrollOffset: number,
  ): void {
    if (outerRef && psRef) {
      const newOffset = Math.max(_scrollOffset, 0);
      const newHOffset = Math.max(_horizontalScrollOffset, 0);

      let isUpdateRequired = false;
      if (scrollOffset !== newOffset) {
        outerRef.scrollTop = newOffset;
        isUpdateRequired = true;
      }
      if (horizontalScrollOffset !== newHOffset) {
        outerRef.scrollLeft = newHOffset;
        isUpdateRequired = true;
      }
      if (isUpdateRequired) {
        psRef.update();
      }
    }
  }
</script>

<div
  class={outerClass}
  style="height:{height}px;width:100%;direction:ltr;"
  bind:this={outerRef}>
  <div
      bind:this={innerRef}
      style="height:{estimatedTotalSize + paddingBottom}px;
            {isScrolling ? 'pointer-events:none;' : ''}width:100%;">
      <slot {items} />
  </div>
</div>

<style global lang="scss">
  @import "VirtualList.scss";
</style>
