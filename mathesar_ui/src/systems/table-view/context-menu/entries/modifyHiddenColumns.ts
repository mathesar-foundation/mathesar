import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconHideColumn } from '@mathesar/icons';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* modifyHiddenColumns(p: {
  column: ProcessedColumn;
  tabularData: TabularData;
}) {
  const hiddenColumnsStore = p.tabularData.meta.hiddenColumns;
  const hiddenColumns = get(hiddenColumnsStore);
  const isHidden = hiddenColumns.hasColumn(p.column.id);

  if (isHidden) {
    return;
  }

  yield buttonMenuEntry({
    icon: iconHideColumn,
    label: get(_)('hide_column'),
    onClick: () => {
      hiddenColumnsStore.update((h) => h.withColumn(p.column.id));
    },
  });
}

export function* modifyHiddenColumnsMultiple(p: {
  columnIds: string[];
  tabularData: TabularData;
}) {
  const hiddenColumnsStore = p.tabularData.meta.hiddenColumns;
  const hiddenColumns = get(hiddenColumnsStore);
  const count = p.columnIds.length;
  const allHidden = p.columnIds.every((id) => hiddenColumns.has(id));

  if (allHidden) {
    return;
  }
  yield buttonMenuEntry({
    icon: iconHideColumn,
    label: get(_)('hide_columns_count', { values: { count } }),
    onClick: () => {
      hiddenColumnsStore.update((h) => h.withColumns(p.columnIds));
    },
  });
}
