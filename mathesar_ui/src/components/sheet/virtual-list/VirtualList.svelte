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
  import type { Timeout } from './timer';
  import { cancelTimeout, requestTimeout } from './timer';
  import listUtils from './listUtils';
  import type { Props, ItemInfo } from './listUtils';
  import type { SheetVirtualRowsApi } from '../types';

  const dispatch = createEventDispatcher();

  let classes = 'default';
  export { classes as class };
  $: outerClass = ['virtual-list', 'outerElement', classes].join(' ');

  export let estimatedItemSize: number = DEFAULT_ESTIMATED_ITEM_SIZE;
  export let height: Props['height'];
  export let scrollOffset: Props['scrollOffset'] = 0;
  export let itemCount: Props['itemCount'];
  export let overscanCount: Props['overscanCount'] = 2;
  export let itemSize: Props['itemSize'] = (): number => estimatedItemSize;
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  export let itemKey: Props['itemKey'] = listUtils.defaultItemKey;
  export let width: number | undefined = undefined;

  let instanceProps: Props['instanceProps'] = {
    lastMeasuredIndex: -1,
    itemMetadataMap: {},
    styleCache: {},
  };
  let isScrolling: Props['isScrolling'] = false;
  let scrollDirection: Props['scrollDirection'] = 'forward';
  let lastHeight: Props['height'] = height;

  let items: ItemInfo['items'] = [];
  let estimatedTotalSize: number;

  let outerRef: HTMLElement;

  let requestResetIsScrolling = false;
  let resetIsScrollingTimeoutId: Timeout | undefined;

  let requestGetItemStyleCache = false;
  let psRef: PerfectScrollbar | undefined;

  let itemInfo: ItemInfo;

  function recalc(opts: Props) {
    itemInfo = listUtils.getItemsInfo(opts);
    items = itemInfo.items;
    estimatedTotalSize = listUtils.getEstimatedTotalSize(opts);

    // Refetch when container resizes
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

  $: innerStyle =
    `height:${estimatedTotalSize + paddingBottom}px;` +
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `width:${width ? `${width}px` : '100%'};` +
    `${isScrolling ? 'pointer-events:none;' : ''}`;

  function onHscrollChange(_hscrollOffset: number) {
    if (
      outerRef &&
      typeof _hscrollOffset === 'number' &&
      outerRef.scrollLeft !== _hscrollOffset
    ) {
      outerRef.scrollLeft = _hscrollOffset;
    }
  }

  // For direct updates on horizontalScrollOffset
  $: onHscrollChange(horizontalScrollOffset);

  function onScroll(event: Event): void {
    const { clientHeight, scrollHeight, scrollTop, scrollLeft } =
      event.target as HTMLElement;
    requestResetIsScrolling = true;
    horizontalScrollOffset = scrollLeft;

    // Scroll position may have been updated directly
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
    const { scrollLeft } = event.target as HTMLElement;
    horizontalScrollOffset = scrollLeft;
  }

  onMount(() => {
    if (typeof scrollOffset === 'number') {
      outerRef.scrollTop = scrollOffset;
    }
    onHscrollChange(horizontalScrollOffset);

    psRef = new PerfectScrollbar(outerRef, {
      minScrollbarLength: 40,
      wheelPropagation: false,
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

    return () => {
      outerRef.removeEventListener('ps-scroll-y', callback);
      outerRef.removeEventListener('ps-scroll-x', hCallback);
      psRef?.destroy();
    };
  });

  const scrollStopped = () => {
    resetIsScrollingTimeoutId = undefined;
    isScrolling = false;
    requestGetItemStyleCache = true;
    dispatch('refetch', itemInfo);
  };

  function resetIsScrollingDebounced() {
    if (resetIsScrollingTimeoutId !== undefined) {
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
    if (resetIsScrollingTimeoutId !== undefined) {
      cancelTimeout(resetIsScrollingTimeoutId);
    }
  });

  export function recalculateHeightsAfterIndex(index: number): void {
    instanceProps = {
      ...instanceProps,
      lastMeasuredIndex: Math.min(
        instanceProps.lastMeasuredIndex,
        (index ?? 0) - 1,
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

  export function scrollToBottom(): void {
    if (outerRef && psRef) {
      outerRef.scrollTop = outerRef.scrollHeight;
      psRef.update();
    }
  }

  export function scrollToTop(): void {
    if (outerRef && psRef) {
      outerRef.scrollTop = 0;
      psRef.update();
    }
  }

  const api: SheetVirtualRowsApi = {
    scrollToTop,
    scrollToBottom,
    scrollToPosition,
    recalculateHeightsAfterIndex,
  };
</script>

<div
  class={outerClass}
  style="height:{height}px;width:100%;direction:ltr;"
  bind:this={outerRef}
>
  <div style={innerStyle}>
    <slot {items} {api} />
  </div>
</div>

<style global lang="scss">
  @import 'VirtualList.scss';
</style>
