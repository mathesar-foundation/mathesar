import { get } from 'svelte/store';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { CellInfo } from '@mathesar/stores/abstract-types/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { TableEntry } from '@mathesar/api/types/tables';
import DataTypes from './data-types';
import type { CellColumnLike } from './data-types/typeDefinitions';
import type { LinkedRecordCellExternalProps } from './data-types/components/typeDefinitions';
import LinkedRecordCell from './data-types/components/linked-record/LinkedRecordCell.svelte';
import PrimaryKeyCell from './data-types/components/primary-key/PrimaryKeyCell.svelte';
import LinkedRecordInput from './data-types/components/linked-record/LinkedRecordInput.svelte';

function getCellInfo(dbType: CellColumnLike['type']): CellInfo | undefined {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    dbType,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.cellInfo;
}

function getCellConfiguration(
  dbType: CellColumnLike['type'],
  cellInfo?: CellInfo,
): Record<string, unknown> {
  const config = cellInfo?.config ?? {};
  const conditionalConfig = cellInfo?.conditionalConfig?.[dbType] ?? {};
  return {
    ...config,
    ...conditionalConfig,
  };
}

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
  fkTargetTableId?: TableEntry['id'];
  /**
   * When the cell falls within a PK column, this value will give the id of the
   * table.
   */
  pkTargetTableId?: TableEntry['id'];
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
  fkTargetTableId?: TableEntry['id'],
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
