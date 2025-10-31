import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { iconLinkToRecordPage, iconModalRecordView } from '@mathesar/icons';
import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
import type { TabularData } from '@mathesar/stores/table-data';
import { currentTablesMap } from '@mathesar/stores/tables';
import RecordStore from '@mathesar/systems/record-view/RecordStore';
import {
  type ModalController,
  buttonMenuEntry,
  hyperlinkMenuEntry,
} from '@mathesar-component-library';

export function* viewRowRecord(p: {
  recordId: unknown;
  tabularData: TabularData;
  modalRecordView: ModalController<RecordStore> | undefined;
}) {
  if (p.recordId === undefined) return;
  const canViewLinkedEntities = get(p.tabularData.canViewLinkedEntities);
  if (!canViewLinkedEntities) return;

  yield buttonMenuEntry({
    label: get(_)('quick_view_record'),
    icon: iconModalRecordView,
    onClick: () => {
      if (!p.modalRecordView) return;
      if (p.recordId === undefined) return;
      const containingTable = get(currentTablesMap).get(
        p.tabularData.table.oid,
      );
      if (!containingTable) return;
      const recordStore = new RecordStore({
        table: containingTable,
        recordPk: String(p.recordId),
      });
      p.modalRecordView.open(recordStore);
    },
  });

  const getRecordPageUrl = get(storeToGetRecordPageUrl);
  const recordPageUrl = getRecordPageUrl({
    tableId: p.tabularData.table.oid,
    recordId: p.recordId,
  });
  if (!recordPageUrl) return;

  yield hyperlinkMenuEntry({
    icon: iconLinkToRecordPage,
    label: get(_)('open_record'),
    href: recordPageUrl,
  });
}
