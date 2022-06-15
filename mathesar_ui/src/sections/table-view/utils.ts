import type { Column, Constraint } from '@mathesar/stores/table-data/types';
import type { SheetColumn } from '@mathesar/components/sheet/types';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import {
  getAbstractTypeForDbType,
  getFiltersForAbstractType,
} from '@mathesar/stores/abstract-types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
} from '@mathesar/components/cell/utils';

// TODO: Think of a better name
export interface ProcessedTableColumn extends SheetColumn {
  dbTypeInputCap: ReturnType<typeof getDbTypeBasedInputCap>;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
}

export function getProcessedColumn(
  column: Column,
  constraints: Constraint[],
  abstractTypeMap: AbstractTypesMap,
): ProcessedTableColumn {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    abstractTypeMap,
  );
  return {
    column,
    abstractTypeOfColumn,
    cellCap: getCellCap(column, constraints, abstractTypeOfColumn.cell),
    dbTypeInputCap: getDbTypeBasedInputCap(column, abstractTypeOfColumn.cell),
    allowedFiltersMap: getFiltersForAbstractType(
      abstractTypeOfColumn.identifier,
    ),
  };
}

export type ProcessedTableColumnMap = Map<Column['id'], ProcessedTableColumn>;

export function getProcessedColumnsMap(
  columns: Column[],
  constraints: Constraint[],
  abstractTypeMap: AbstractTypesMap,
): ProcessedTableColumnMap {
  const map: ProcessedTableColumnMap = new Map();
  columns.forEach((column) => {
    map.set(
      column.id,
      getProcessedColumn(column, constraints, abstractTypeMap),
    );
  });
  return map;
}
