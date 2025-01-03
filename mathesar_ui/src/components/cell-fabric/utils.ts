import type { Column } from '@mathesar/api/rpc/columns';
import type { Table } from '@mathesar/models/Table';
import type { CellInfo } from '@mathesar/stores/abstract-types/types';
import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import DataTypes from './data-types';
import LinkedRecordCell from './data-types/components/linked-record/LinkedRecordCell.svelte';
import LinkedRecordInput from './data-types/components/linked-record/LinkedRecordInput.svelte';
import PrimaryKeyCell from './data-types/components/primary-key/PrimaryKeyCell.svelte';
import type { LinkedRecordCellExternalProps } from './data-types/components/typeDefinitions';
import type { CellColumnLike } from './data-types/typeDefinitions';
import { getCellConfiguration, getCellInfo } from './data-types/utils';

export function getCellCap({
  cellInfo,
  column,
  fkTargetTableId,
  pkTargetTableId,
}: {
  cellInfo: CellInfo;
  column: CellColumnLike;
  /**
   * When the cell falls within an FK column, this value will give the id of the
   * table to which the FK points.
   */
  fkTargetTableId?: Table['oid'];
  /**
   * When the cell falls within a PK column, this value will give the id of the
   * table.
   */
  pkTargetTableId?: Table['oid'];
}): ComponentAndProps {
  if (fkTargetTableId) {
    const props: LinkedRecordCellExternalProps = {
      tableId: fkTargetTableId,
    };
    return {
      component: LinkedRecordCell,
      props,
    };
  }
  if (pkTargetTableId) {
    return {
      component: PrimaryKeyCell,
      props: { tableId: pkTargetTableId },
    };
  }
  const config = getCellConfiguration(column.type, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].get(column, config);
}

export function getDbTypeBasedInputCap(
  column: CellColumnLike,
  fkTargetTableId?: Table['oid'],
  optionalCellInfo?: CellInfo,
): ComponentAndProps {
  if (fkTargetTableId) {
    const props: LinkedRecordCellExternalProps = {
      tableId: fkTargetTableId,
    };
    return {
      component: LinkedRecordInput,
      props,
    };
  }
  const cellInfo = optionalCellInfo ?? getCellInfo(column.type);
  const config = getCellConfiguration(column.type, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].getInput(column, config);
}

export function getDbTypeBasedFilterCap(
  column: CellColumnLike,
  fkTargetTableId?: Table['oid'],
  optionalCellInfo?: CellInfo,
): ComponentAndProps {
  const cellInfo = optionalCellInfo ?? getCellInfo(column.type);
  const factory = DataTypes[cellInfo?.type ?? 'string'];
  if (factory.getFilterInput) {
    const config = getCellConfiguration(column.type, cellInfo);
    return factory.getFilterInput(column, config);
  }
  return getDbTypeBasedInputCap(column, fkTargetTableId, cellInfo);
}

export function getInitialInputValue(
  column: CellColumnLike,
  fkTargetTableId?: Table['oid'],
  optionalCellInfo?: CellInfo,
): unknown {
  if (fkTargetTableId) {
    return undefined;
  }
  const cellInfo = optionalCellInfo ?? getCellInfo(column.type);
  return DataTypes[cellInfo?.type ?? 'string'].initialInputValue;
}

export function getDisplayFormatter(
  column: CellColumnLike,
  columnId?: Column['id'],
): (
  value: unknown,
  recordSummaries?: RecordSummariesForSheet,
) => string | null | undefined {
  const cellInfo = getCellInfo(column.type);
  const config = getCellConfiguration(column.type, cellInfo);
  const dataType = cellInfo?.type ?? 'string';
  const format = DataTypes[dataType].getDisplayFormatter(column, config);
  return (cellValue: unknown, recordSummaries?: RecordSummariesForSheet) => {
    if (!recordSummaries || columnId === undefined) {
      return format(cellValue);
    }
    const recordSummary = recordSummaries
      .get(String(columnId))
      ?.get(String(cellValue));
    if (recordSummary) {
      return recordSummary;
    }
    return format(cellValue);
  };
}
