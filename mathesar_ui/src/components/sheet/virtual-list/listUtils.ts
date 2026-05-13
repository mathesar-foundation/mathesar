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
 * 3. Additional features for slot based pooling
 */

export type ItemKey = string;
export type ItemKeyForSlotPooling = { key: ItemKey; recyclable: boolean };

export interface Item<Row> {
  key: ItemKey;
  index: number;
  row: Row;
  style: Record<string, string | number>;
}

interface ItemMetaData {
  offset: number;
  size: number;
}

export interface Props<Row> {
  rowSize: (row: Row) => number;
  rowKey: (row: Row, index: number) => ItemKey;
  instanceProps: {
    lastMeasuredIndex: number;
    itemMetadataMap: Record<number, ItemMetaData>;
    styleCache: Record<number, Item<Row>['style']>;
  };
  rows: Row[];
  overscanCount: number;
  scrollOffset: number;
  height: number;
  estimatedItemSize: number;
}

export interface ItemInfo<Row> {
  items: Item<Row>[];
  startIndex: number;
  stopIndex: number;
}

export const defaultRowKey = <Row>(row: Row, index: number) => String(index);
export const defaultRowKeyForSlotPooling: <Row>(
  row: Row,
  index: number,
) => ItemKeyForSlotPooling = (index) => ({
  key: String(index),
  recyclable: true,
});

export const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
export const DEFAULT_ESTIMATED_ITEM_SIZE = 30;

function getItemMetadata<Row>(props: Props<Row>, index: number): ItemMetaData {
  const { rowSize, instanceProps } = props;
  const { itemMetadataMap, lastMeasuredIndex } = instanceProps;

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i += 1) {
      const size = rowSize(props.rows[i]);
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

function findNearestItemBinarySearch<Row>(
  props: Props<Row>,
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

function findNearestItemExponentialSearch<Row>(
  props: Props<Row>,
  index: number,
): number {
  const { rows, scrollOffset } = props;
  let interval = 1;
  let itemIndex = index;

  while (
    itemIndex < rows.length &&
    getItemMetadata(props, itemIndex).offset < scrollOffset
  ) {
    itemIndex += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    props,
    Math.min(itemIndex, rows.length - 1),
    Math.floor(itemIndex / 2),
  );
}

function findNearestItem<Row>(props: Props<Row>): number {
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

function getStopIndexForStartIndex<Row>(
  props: Props<Row>,
  startIndex: number,
): number {
  const { height, rows, scrollOffset } = props;

  const itemMetadata = getItemMetadata(props, startIndex);
  const maxOffset = scrollOffset + height;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rows.length - 1 && offset < maxOffset) {
    stopIndex += 1;
    offset += getItemMetadata(props, stopIndex).size;
  }

  return stopIndex;
}

function getRangeToRender<Row>(props: Props<Row>): number[] {
  const { rows, overscanCount } = props;

  if (rows.length === 0) {
    return [0, 0];
  }

  const startIndex = findNearestItem(props);
  const stopIndex = getStopIndexForStartIndex(props, startIndex);
  const overscan = Math.max(1, overscanCount);

  // Rebalance the overscan budget. When one side is clamped at the dataset
  // boundary (rows we wanted to overscan but don't exist), give the leftover
  // to the other side. Without this, scrolling near a boundary makes the
  // rendered window size fluctuate as `stopIndex` walks downward while
  // `renderedStart` stays clamped at 0 — that fluctuation is the source of
  // the slot-pool churn fixed by this rebalance.
  //
  // Three passes:
  //   1. Try to give `overscan` to the above side. Note any deficit.
  //   2. Try to give `overscan + above-deficit` to the below side. Note any
  //      deficit.
  //   3. Try to absorb the below-deficit back into the above side.
  // Result: rendered window size is `(stopIndex - startIndex + 1) +
  // 2*overscan`, clamped to the dataset.
  const overscanAboveAvail = startIndex;
  const overscanBelowAvail = rows.length - 1 - stopIndex;
  const overscanAbove1 = Math.min(overscan, overscanAboveAvail);
  const aboveDeficit = overscan - overscanAbove1;
  const overscanBelow = Math.min(overscanBelowAvail, overscan + aboveDeficit);
  const belowDeficit = overscan + aboveDeficit - overscanBelow;
  const overscanAbove = Math.min(
    overscanAboveAvail,
    overscanAbove1 + belowDeficit,
  );

  // Defensive clamp on the upper bound. In practice the rebalance above
  // already keeps the range within [0, rows.length - 1] — even when
  // `instanceProps.lastMeasuredIndex` is stale past the dataset end
  // (e.g. `rows` shrank without a `recalculateHeightsAfterIndex` call),
  // the negative `overscanBelowAvail` feeds back through `belowDeficit`
  // into `overscanAbove` and pulls the window back inside. That clamp
  // is load-bearing but subtle, so guard against a future refactor of
  // the rebalance breaking it and letting `getItemsInfo` read past the
  // end of `rows`.
  const renderedStop = Math.min(stopIndex + overscanBelow, rows.length - 1);
  return [startIndex - overscanAbove, renderedStop];
}

export function getItemStyle<Row>(
  props: Props<Row>,
  index: number,
): Item<Row>['style'] {
  const { instanceProps } = props;
  const { styleCache } = instanceProps;
  let style: Item<Row>['style'];
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

export function getItemsInfo<Row>(props: Props<Row>): ItemInfo<Row> {
  const { rowKey, rows } = props;
  const [startIndex, stopIndex] = getRangeToRender(props);
  const items: Item<Row>[] = [];
  if (rows.length > 0) {
    for (let index = startIndex; index <= stopIndex; index += 1) {
      items.push({
        key: rowKey(rows[index], index),
        index,
        row: rows[index],
        style: getItemStyle(props, index),
      });
    }
  }
  return {
    items,
    startIndex,
    stopIndex,
  };
}

export function getEstimatedTotalSize<Row>(props: Props<Row>): number {
  const { instanceProps, rows, estimatedItemSize } = props;
  const { lastMeasuredIndex, itemMetadataMap } = instanceProps;

  let lastIndex = lastMeasuredIndex;
  let totalSizeOfMeasuredItems = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastIndex >= rows.length) {
    lastIndex = rows.length - 1;
  }

  if (lastIndex >= 0) {
    const itemMetadata = itemMetadataMap[lastIndex];
    totalSizeOfMeasuredItems = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = rows.length - lastIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedItemSize;

  return totalSizeOfMeasuredItems + totalSizeOfUnmeasuredItems;
}
