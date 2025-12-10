import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconAddFilter, iconRemoveFilter } from '@mathesar/icons';
import type { ImperativeFilterController } from '@mathesar/pages/table/ImperativeFilterController';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* modifyFilters(p: {
  tabularData: TabularData;
  column: ProcessedColumn;
  imperativeFilterController: ImperativeFilterController | undefined;
}) {
  const filteringStore = p.tabularData.meta.filtering;
  const filtering = get(filteringStore);
  const filterCount = filtering.appliedFilterCountForColumn(p.column.id);
  if (!p.imperativeFilterController) return;
  const { imperativeFilterController } = p;

  yield buttonMenuEntry({
    icon: iconAddFilter,
    label: filterCount > 0 ? get(_)('add_filter') : get(_)('filter_column'),
    onClick: () => {
      void imperativeFilterController.beginAddingNewFilteringEntry(p.column.id);
    },
  });

  if (filterCount) {
    yield buttonMenuEntry({
      icon: iconRemoveFilter,
      label: get(_)('remove_filters', { values: { count: filterCount } }),
      onClick: () =>
        filteringStore.update((f) => f.withoutColumns([p.column.id])),
    });
  }
}
