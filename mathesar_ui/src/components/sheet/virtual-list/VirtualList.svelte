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
</script>

<script lang="ts">
  import PerfectScrollbar from 'perfect-scrollbar';
  import {
    afterUpdate,
    createEventDispatcher,
    onDestroy,
    onMount,
  } from 'svelte';

  import type { SheetVirtualRowsApi } from '../types';

  import {
    DEFAULT_ESTIMATED_ITEM_SIZE,
    IS_SCROLLING_DEBOUNCE_INTERVAL,
    type Props,
    defaultRowKey,
    getEstimatedTotalSize,
    getItemStyle,
    getItemsInfo,
  } from './listUtils';
  import { type Timeout, cancelTimeout, requestTimeout } from './timer';

  const dispatch = createEventDispatcher();

  let classes = 'default';
  export { classes as class };
  $: outerClass = ['virtual-list', 'outerElement', classes].join(' ');

  type Row = $$Generic;

  export let rows: Row[];

  export let estimatedItemSize: number = DEFAULT_ESTIMATED_ITEM_SIZE;
  export let height: Props<Row>['height'];
  export let scrollOffset: Props<Row>['scrollOffset'] = 0;
  export let overscanCount: Props<Row>['overscanCount'] = 3;
  export let rowSize: Props<Row>['rowSize'] = (): number => estimatedItemSize;
  export let rowKey: Props<Row>['rowKey'] = defaultRowKey;
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  export let width: number | undefined = undefined;

  let instanceProps: Props<Row>['instanceProps'] = {
    lastMeasuredIndex: -1,
    itemMetadataMap: {},
    styleCache: {},
  };
  let isScrolling = false;

  let outerRef: HTMLElement;

  let requestResetIsScrolling = false;
  let resetIsScrollingTimeoutId: Timeout | undefined;

  let psRef: PerfectScrollbar | undefined;

  $: props = {
    rowSize,
    instanceProps,
    isScrolling,
    rows,
    overscanCount,
    scrollOffset,
    height,
    rowKey,
    estimatedItemSize,
  };
  $: items = getItemsInfo(props).items;
  $: estimatedTotalSize = getEstimatedTotalSize(props);

  $: innerStyle =
    `height:${estimatedTotalSize + paddingBottom}px;` +
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
    if (horizontalScrollOffset !== scrollLeft) {
      horizontalScrollOffset = scrollLeft;
      dispatch('h-scroll', horizontalScrollOffset);
    }

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
      scrollOffset = newScrollOffset;
      dispatch('scroll', scrollOffset);
    }
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

    outerRef.addEventListener('scroll', callback);

    return () => {
      outerRef.removeEventListener('scroll', callback);
      psRef?.destroy();
    };
  });

  const scrollStopped = () => {
    resetIsScrollingTimeoutId = undefined;
    isScrolling = false;
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

  function getStyle(index: number) {
    return getItemStyle(props, index);
  }

  const api: SheetVirtualRowsApi = {
    scrollToTop,
    scrollToBottom,
    scrollToPosition,
    recalculateHeightsAfterIndex,
    getStyle,
  };
</script>

<div
  class={outerClass}
  style="height:{height}px;width:100%;direction:ltr;"
  data-sheet-body-element="list"
  bind:this={outerRef}
>
  <div style={innerStyle}>
    <slot {items} {api} />
  </div>
</div>

<style global lang="scss">
  @import 'VirtualList.scss';
</style>
