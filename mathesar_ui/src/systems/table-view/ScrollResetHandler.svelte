<script lang="ts">
  import { beforeUpdate, tick } from 'svelte';

  import type { SheetVirtualRowsApi } from '@mathesar/components/sheet/types';
  import {
    Filtering,
    Grouping,
    type Row,
    Sorting,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import type Pagination from '@mathesar/utils/Pagination';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData, display, meta } = $tabularData);
  $: ({ newRecords } = recordsData);
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

  async function resetIndex(_displayableRecords: Row[]) {
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

  $: void resetIndex($displayableRecords);
</script>
