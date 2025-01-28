<script lang="ts">
  import { beforeUpdate, tick } from 'svelte';

  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import type { SheetVirtualRowsApi } from '@mathesar/components/sheet/types';
  import {
    type Filtering,
    type Grouping,
    type Row,
    type Sorting,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import type Pagination from '@mathesar/utils/Pagination';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData, display, meta } = $tabularData);
  $: ({ newRecords, state } = recordsData);
  $: ({ sorting, filtering, grouping, pagination } = meta);
  $: ({ displayableRecords } = display);

  export let api: SheetVirtualRowsApi;

  let initialSorting: Sorting;
  let initialFiltering: Filtering;
  let initialGrouping: Grouping;
  let initialPagination: Pagination;

  beforeUpdate(() => {
    initialSorting = $sorting;
    initialFiltering = $filtering;
    initialGrouping = $grouping;
    initialPagination = $pagination;
  });

  $: {
    if (
      initialSorting !== $sorting ||
      initialFiltering !== $filtering ||
      initialGrouping !== $grouping ||
      initialPagination !== $pagination
    ) {
      api.scrollToTop();
    }
  }

  let previousNewRecordsCount = 0;
  let previousAllRecordsCount = 0;
  let prevGrouping: Grouping;

  async function recalculateAllRowHeights() {
    await tick();
    api.recalculateHeightsAfterIndex(0);
  }

  async function caculateHeightsForNewRows(_displayableRecords: Row[]) {
    const allRecordCount = _displayableRecords.length ?? 0;
    const newRecordCount = $newRecords.length ?? 0;
    if (previousNewRecordsCount !== newRecordCount) {
      const index = Math.max(
        previousAllRecordsCount - previousNewRecordsCount - 3,
        0,
      );
      await tick();
      if (previousNewRecordsCount < newRecordCount) {
        api.scrollToBottom();
      }
      previousNewRecordsCount = newRecordCount;
      previousAllRecordsCount = allRecordCount;
      api.recalculateHeightsAfterIndex(index);
    }
  }

  async function recalculateRowHeights(
    _recordState: States,
    _displayableRecords: Row[],
  ) {
    /**
     * Only perform full recalculation of heights when,
     * 1. Grouping is applied
     * 2. Grouping is removed
     * 3. Grouping changes
     * 4. Any kind of refetch occurs when grouping is present
     *    - Pagination
     *    - Filtering
     *    - Sorting
     *    - Clicking on refresh button etc.,
     */
    const isCompleteRowHeightRecalcNeeded =
      _recordState !== States.Loading &&
      (prevGrouping !== $grouping || $grouping.entries.length > 0);

    if (isCompleteRowHeightRecalcNeeded) {
      await recalculateAllRowHeights();
      prevGrouping = $grouping;
      return;
    }

    await caculateHeightsForNewRows(_displayableRecords);
  }

  $: void recalculateRowHeights($state, $displayableRecords);
</script>
