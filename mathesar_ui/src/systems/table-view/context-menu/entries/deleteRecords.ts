import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconDeleteMajor } from '@mathesar/icons';
import { confirm } from '@mathesar/stores/confirmation';
import type { TabularData } from '@mathesar/stores/table-data';
import { toast } from '@mathesar/stores/toast';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* deleteRecords(p: {
  rowIds: string[];
  tabularData: TabularData;
}) {
  const canDeleteRecords = get(p.tabularData.canDeleteRecords);
  if (!canDeleteRecords) return;

  yield buttonMenuEntry({
    icon: iconDeleteMajor,
    danger: true,
    label: get(_)('delete_records', {
      values: { count: p.rowIds.length },
    }),
    onClick: () => {
      void confirm({
        title: get(_)('delete_records_question', {
          values: { count: p.rowIds.length },
        }),
        body: [
          get(_)('deleted_records_cannot_be_recovered', {
            values: { count: p.rowIds.length },
          }),
          get(_)('are_you_sure_to_proceed'),
        ],
        onProceed: () => p.tabularData.recordsData.deleteSelected(p.rowIds),
        onError: (e) => toast.fromError(e),
      });
    },
  });
}
