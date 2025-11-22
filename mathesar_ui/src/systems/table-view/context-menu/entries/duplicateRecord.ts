import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconDuplicateRecord } from '@mathesar/icons';
import type { TabularData } from '@mathesar/stores/table-data';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* duplicateRecord(p: {
  rowId: string;
  tabularData: TabularData;
}) {
  const canInsertRecords = get(p.tabularData.canInsertRecords);
  if (!canInsertRecords) return;
  const rows = get(p.tabularData.recordsData.selectableRowsMap);

  yield buttonMenuEntry({
    icon: iconDuplicateRecord,
    label: get(_)('duplicate_record'),
    onClick: () => {
      const row = rows.get(p.rowId);
      if (!row) return;
      void p.tabularData.recordsData.duplicateRecord(row);
    },
  });
}
