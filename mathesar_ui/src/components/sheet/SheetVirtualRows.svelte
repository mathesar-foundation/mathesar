<script lang="ts">
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  import { getSheetContext } from './utils';
  import {
    type ItemKey,
    type ItemKeyForSlotPooling,
    Resizer,
    type VirtualListProps,
    VirtualListWithSlotPooling,
  } from './virtual-list';

  const { stores, api } = getSheetContext();
  const { rowWidth, horizontalScrollOffset, scrollOffset } = stores;

  type Row = $$Generic;

  const VLComponent = VirtualListWithSlotPooling<Row>;

  export let rows: Row[];
  export let rowSize: VirtualListProps<Row>['rowSize'];
  export let paddingBottom = 0;
  export let rowKeyForSlotPooling:
    | ((row: Row, index: number) => ItemKeyForSlotPooling)
    | undefined = undefined;
  export let alwaysRenderRows: ItemKey[] = [];
  export let indexByKey: ((id: ItemKey) => number | undefined) | undefined =
    undefined;
</script>

<div data-sheet-element="body" tabindex="-1">
  <Resizer let:height>
    <VLComponent
      horizontalScrollOffset={$horizontalScrollOffset}
      scrollOffset={$scrollOffset}
      {height}
      width={$rowWidth}
      {rows}
      {paddingBottom}
      {rowSize}
      {rowKeyForSlotPooling}
      estimatedItemSize={ROW_HEIGHT_PX}
      {alwaysRenderRows}
      {indexByKey}
      let:items
      let:api={virtualListApi}
      on:scroll={(e) => {
        api.setScrollOffset(e.detail);
      }}
      on:h-scroll={(e) => {
        api.setHorizontalScrollOffset(e.detail);
      }}
    >
      <slot {items} api={virtualListApi} />
    </VLComponent>
  </Resizer>
</div>

<style lang="scss">
  [data-sheet-element='body'] {
    position: relative;
    flex-shrink: 0;
    flex-grow: 1;
    overflow: hidden;
  }
</style>
