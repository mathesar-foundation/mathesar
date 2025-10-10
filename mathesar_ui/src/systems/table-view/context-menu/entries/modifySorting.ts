import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  type SortDirection,
  getSortingLabelForColumn,
} from '@mathesar/components/sort-entry/utils';
import { iconSortAscending, iconSortDescending } from '@mathesar/icons';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* modifySorting(p: {
  column: ProcessedColumn;
  tabularData: TabularData;
}) {
  const sortingStore = p.tabularData.meta.sorting;
  const sorting = get(sortingStore);
  const currentSorting = sorting.get(p.column.id);
  const sortingLabel = getSortingLabelForColumn(
    p.column.abstractType.cellInfo.type,
    !!p.column.linkFk,
  );

  function removeSorting() {
    sortingStore.update((s) => s.without(p.column.id));
  }

  function applySorting(sortDirection: SortDirection) {
    sortingStore.update((s) => s.with(p.column.id, sortDirection));
  }

  if (currentSorting === 'ASCENDING') {
    yield buttonMenuEntry({
      icon: iconSortAscending,
      label: get(_)('remove_sorting_type', {
        values: { sortingType: sortingLabel.ASCENDING },
      }),
      onClick: removeSorting,
    });
  } else {
    yield buttonMenuEntry({
      icon: iconSortAscending,
      label: get(_)('sort_type', {
        values: { sortingType: sortingLabel.ASCENDING },
      }),
      onClick: () => applySorting('ASCENDING'),
    });
  }

  if (currentSorting === 'DESCENDING') {
    yield buttonMenuEntry({
      icon: iconSortDescending,
      label: get(_)('remove_sorting_type', {
        values: { sortingType: sortingLabel.DESCENDING },
      }),
      onClick: removeSorting,
    });
  } else {
    yield buttonMenuEntry({
      icon: iconSortDescending,
      label: get(_)('sort_type', {
        values: { sortingType: sortingLabel.DESCENDING },
      }),
      onClick: () => applySorting('DESCENDING'),
    });
  }
}
