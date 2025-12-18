import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconHideColumn, iconShowColumn } from '@mathesar/icons';
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
    yield buttonMenuEntry({
      icon: iconShowColumn,
      label: get(_)('show_column'),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withoutColumn(p.column.id));
      },
    });
  } else {
    yield buttonMenuEntry({
      icon: iconHideColumn,
      label: get(_)('hide_column'),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withColumn(p.column.id));
      },
    });
  }
}

export function* modifyHiddenColumnsMultiple(p: {
  columnIds: string[];
  tabularData: TabularData;
}) {
  const hiddenColumnsStore = p.tabularData.meta.hiddenColumns;
  const hiddenColumns = get(hiddenColumnsStore);
  const count = p.columnIds.length;
  const allHidden = p.columnIds.every((id) => hiddenColumns.has(id));
  const someHidden = p.columnIds.some((id) => hiddenColumns.has(id));

  if (allHidden) {
    yield buttonMenuEntry({
      icon: iconShowColumn,
      label: get(_)('show_columns_count', { values: { count } }),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withoutColumns(p.columnIds));
      },
    });
  } else if (someHidden) {
    yield buttonMenuEntry({
      icon: iconHideColumn,
      label: get(_)('hide_columns_count', { values: { count } }),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withColumns(p.columnIds));
      },
    });
    yield buttonMenuEntry({
      icon: iconShowColumn,
      label: get(_)('show_columns_count', { values: { count } }),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withoutColumns(p.columnIds));
      },
    });
  } else {
    yield buttonMenuEntry({
      icon: iconHideColumn,
      label: get(_)('hide_columns_count', { values: { count } }),
      onClick: () => {
        hiddenColumnsStore.update((h) => h.withColumns(p.columnIds));
      },
    });
  }
}
