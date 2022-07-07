/**
 * Forked and ported from "react-window@1.8.6"
 * https://github.com/bvaughn/react-window
 * Copyright (c) 2018 Brian Vaughn
 *
 * Inspired by "svelte-window@1.2.3"
 * https://github.com/micha-lmxt/svelte-window
 * Copyright (c) 2021 Michael Lucht
 *
 * This fork contains the following changes:
 * 1. Ported to TS
 * 2. Stripped down to essentials
 */

interface Item {
  key: number | string;
  index: number;
  isScrolling: boolean;
  style: { [key: string]: string | number };
}

interface ItemMetaData {
  offset: number;
  size: number;
}

export interface Props {
  itemSize: (index: number) => number;
  instanceProps: {
    lastMeasuredIndex: number;
    itemMetadataMap: Record<number, ItemMetaData>;
    styleCache: Record<number, Item['style']>;
  };
  isScrolling: boolean;
  scrollDirection: 'forward' | 'backward';
  itemCount: number;
  overscanCount: number;
  scrollOffset: number;
  height: number;
  itemKey: (index: number) => number | string;
  estimatedItemSize: number;
}

export interface ItemInfo {
  items: Item[];
  startIndex: number;
  stopIndex: number;
}

const defaultItemKey: Props['itemKey'] = (index: number) => index;

function getItemMetadata(props: Props, index: number): ItemMetaData {
  const { itemSize, instanceProps } = props;
  const { itemMetadataMap, lastMeasuredIndex } = instanceProps;

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i += 1) {
      const size = itemSize(i);
      itemMetadataMap[i] = {
        offset,
        size,
      };
      offset += size;
    }

    instanceProps.lastMeasuredIndex = index;
  }

  return itemMetadataMap[index];
}

function findNearestItemBinarySearch(
  props: Props,
  initialHigh: number,
  initialLow: number,
): number {
  const { scrollOffset } = props;
  let high = initialHigh;
  let low = initialLow;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(props, middle).offset;

    if (currentOffset === scrollOffset) {
      return middle;
    }

    if (currentOffset < scrollOffset) {
      low = middle + 1;
    } else if (currentOffset > scrollOffset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  }
  return 0;
}

function findNearestItemExponentialSearch(props: Props, index: number): number {
  const { itemCount, scrollOffset } = props;
  let interval = 1;
  let itemIndex = index;

  while (
    itemIndex < itemCount &&
    getItemMetadata(props, itemIndex).offset < scrollOffset
  ) {
    itemIndex += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    props,
    Math.min(itemIndex, itemCount - 1),
    Math.floor(itemIndex / 2),
  );
}

function findNearestItem(props: Props): number {
  const { instanceProps, scrollOffset } = props;
  const { itemMetadataMap, lastMeasuredIndex } = instanceProps;

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= scrollOffset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch(props, lastMeasuredIndex, 0);
  }
  /**
   * If we haven't yet measured this high, fallback to an exponential
   * search with an inner binary search.
   *
   * The exponential search avoids pre-computing sizes for the full set
   * of items as a binary search would.
   *
   * The overall complexity for this approach is O(log n).
   */
  return findNearestItemExponentialSearch(
    props,
    Math.max(0, lastMeasuredIndex),
  );
}

function getStopIndexForStartIndex(props: Props, startIndex: number): number {
  const { height, itemCount, scrollOffset } = props;

  const itemMetadata = getItemMetadata(props, startIndex);
  const maxOffset = scrollOffset + height;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < itemCount - 1 && offset < maxOffset) {
    stopIndex += 1;
    offset += getItemMetadata(props, stopIndex).size;
  }

  return stopIndex;
}

function getRangeToRender(props: Props): number[] {
  const { isScrolling, scrollDirection, itemCount, overscanCount } = props;

  if (itemCount === 0) {
    return [0, 0, 0, 0];
  }

  const startIndex = findNearestItem(props);
  const stopIndex = getStopIndexForStartIndex(props, startIndex);

  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanBackward =
    !isScrolling || scrollDirection === 'backward'
      ? Math.max(1, overscanCount)
      : 1;
  const overscanForward =
    !isScrolling || scrollDirection === 'forward'
      ? Math.max(1, overscanCount)
      : 1;

  return [
    Math.max(0, startIndex - overscanBackward),
    Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)),
    startIndex,
    stopIndex,
  ];
}

function getItemStyle(props: Props, index: number): Item['style'] {
  const { instanceProps } = props;
  const { styleCache } = instanceProps;
  let style: Item['style'];
  if (Object.prototype.hasOwnProperty.call(styleCache, index)) {
    style = styleCache[index];
  } else {
    const { offset } = getItemMetadata(props, index);
    const { size } = instanceProps.itemMetadataMap[index];

    style = {
      position: 'absolute',
      left: 0,
      top: offset,
      height: size,
      width: '100%',
    };

    styleCache[index] = style;
  }
  return style;
}

function getItemsInfo(props: Props): ItemInfo {
  const { itemKey, itemCount, isScrolling } = props;
  const [startIndex, stopIndex] = getRangeToRender(props);
  const items: Item[] = [];
  if (startIndex < stopIndex) {
    items.length = stopIndex - startIndex + 1;
  }

  if (itemCount > 0) {
    let i = 0;
    for (let index = startIndex; index <= stopIndex; index += 1) {
      items[i] = {
        key: itemKey(index),
        index,
        isScrolling,
        style: getItemStyle(props, index),
      };
      i += 1;
    }
  }
  return {
    items,
    startIndex,
    stopIndex,
  };
}

function getEstimatedTotalSize(props: Props): number {
  const { instanceProps, itemCount, estimatedItemSize } = props;
  const { lastMeasuredIndex, itemMetadataMap } = instanceProps;

  let lastIndex = lastMeasuredIndex;
  let totalSizeOfMeasuredItems = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastIndex >= itemCount) {
    lastIndex = itemCount - 1;
  }

  if (lastIndex >= 0) {
    const itemMetadata = itemMetadataMap[lastIndex];
    totalSizeOfMeasuredItems = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = itemCount - lastIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedItemSize;

  return totalSizeOfMeasuredItems + totalSizeOfUnmeasuredItems;
}

export default {
  defaultItemKey,
  getItemsInfo,
  getEstimatedTotalSize,
};
