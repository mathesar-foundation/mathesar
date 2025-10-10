import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconGrouping } from '@mathesar/icons';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* modifyGrouping(p: {
  column: ProcessedColumn;
  tabularData: TabularData;
}) {
  const groupingStore = p.tabularData.meta.grouping;
  const grouping = get(groupingStore);
  const hasGrouping = grouping.hasColumn(p.column.id);

  if (hasGrouping) {
    yield buttonMenuEntry({
      icon: iconGrouping,
      label: get(_)('remove_grouping'),
      onClick: () => {
        groupingStore.update((g) => g.withoutColumns([p.column.id]));
      },
    });
  } else {
    yield buttonMenuEntry({
      icon: iconGrouping,
      label: get(_)('group_by_column'),
      onClick: () =>
        groupingStore.update((g) =>
          g.withEntry({ columnId: p.column.id, preprocFnId: undefined }),
        ),
    });
  }
}
