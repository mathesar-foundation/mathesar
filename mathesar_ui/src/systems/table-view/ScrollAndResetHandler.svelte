<script lang="ts">
  import { beforeUpdate, tick } from 'svelte';
  import {
    Sorting,
    Filtering,
    Grouping,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import type { Row } from '@mathesar/stores/table-data/types';
  import type { SheetVirtualRowsApi } from '@mathesar/components/sheet/types';
  import type Pagination from '@mathesar/utils/Pagination';
  import type { States } from '@mathesar/utils/api';

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
  let prevRecordState: States;

  async function resetIndex(_recordState: States, _displayableRecords: Row[]) {
    if (
      prevGrouping !== $grouping ||
      ($grouping.size > 0 && prevRecordState !== _recordState)
    ) {
      await tick();
      // Reset if grouping is active
      api.recalculateHeightsAfterIndex(0);
      prevGrouping = $grouping;
      prevRecordState = _recordState;
      return;
    }

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

  $: void resetIndex($state, $displayableRecords);
</script>
