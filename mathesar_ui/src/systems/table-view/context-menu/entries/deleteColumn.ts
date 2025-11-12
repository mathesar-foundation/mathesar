import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconDeleteMajor } from '@mathesar/icons';
import { confirmDelete } from '@mathesar/stores/confirmation';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* deleteColumn(p: {
  column: ProcessedColumn;
  tabularData: TabularData;
}) {
  const canDeleteColumn = get(
    p.tabularData.table.currentAccess.currentRoleOwns,
  );
  if (!canDeleteColumn) return;

  yield buttonMenuEntry({
    icon: iconDeleteMajor,
    danger: true,
    label: get(_)('delete_column'),
    onClick: () => {
      void confirmDelete({
        identifierType: get(_)('column'),
        identifierName: p.column.column.name,
        body: [
          get(_)('all_objects_related_to_column_affected'),
          get(_)('could_break_tables_views'),
          get(_)('are_you_sure_to_proceed'),
        ],
        onProceed: () =>
          p.tabularData.columnsDataStore.deleteColumn(Number(p.column.id)),
      });
    },
  });
}
