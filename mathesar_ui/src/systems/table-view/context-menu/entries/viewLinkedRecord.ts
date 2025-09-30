import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { ResultValue } from '@mathesar/api/rpc/records';
import type { ModalController } from '@mathesar/component-library';
import { iconLinkToRecordPage, iconModalRecordView } from '@mathesar/icons';
import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
import type { ProcessedColumn, TabularData } from '@mathesar/stores/table-data';
import { currentTablesMap } from '@mathesar/stores/tables';
import RecordStore from '@mathesar/systems/record-view/RecordStore';
import {
  buttonMenuEntry,
  component,
  dividerMenuEntry,
  hyperlinkMenuEntry,
} from '@mathesar-component-library';

import TranslatedTextWithRecordSummary from '../labels/TranslatedTextWithRecordSummary.svelte';

export function* viewLinkedRecord(p: {
  tabularData: TabularData;
  column: ProcessedColumn | undefined;
  cellValue: ResultValue | undefined;
  modalRecordView: ModalController<RecordStore> | undefined;
}) {
  if (!p.column) return;
  if (!p.cellValue === undefined || p.cellValue === null) return;
  const { linkFk } = p.column;
  if (!linkFk) return;
  const canViewLinkedEntities = get(p.tabularData.canViewLinkedEntities);
  if (!canViewLinkedEntities) return;
  const linkedTable = get(currentTablesMap).get(linkFk.referent_table_oid);
  if (!linkedTable) return;
  const getRecordUrl = get(storeToGetRecordPageUrl);
  const href = getRecordUrl({
    tableId: linkedTable.oid,
    recordId: p.cellValue,
  });
  if (!href) return;
  const linkedRecordSummaries = get(
    p.tabularData.recordsData.linkedRecordSummaries,
  );
  const recordSummary = linkedRecordSummaries
    .get(String(p.column.id))
    ?.get(String(p.cellValue));
  if (!recordSummary) return;

  yield buttonMenuEntry({
    label: component(TranslatedTextWithRecordSummary, {
      translatedText: get(_)('quick_view_named_record'),
      recordSummary,
    }),
    icon: iconModalRecordView,
    onClick: () => {
      if (!p.modalRecordView) return;
      const recordStore = new RecordStore({
        table: linkedTable,
        recordPk: String(p.cellValue),
      });
      p.modalRecordView.open(recordStore);
    },
  });

  yield hyperlinkMenuEntry({
    label: component(TranslatedTextWithRecordSummary, {
      translatedText: get(_)('open_named_record'),
      recordSummary,
    }),
    icon: iconLinkToRecordPage,
    href,
  });

  yield dividerMenuEntry();
}
