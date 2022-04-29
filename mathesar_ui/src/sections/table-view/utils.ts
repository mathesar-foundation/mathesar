import type { Column } from '@mathesar/stores/table-data/types';
import type { SheetColumn } from '@mathesar/components/sheet/types';
import type {
  AbstractTypesMap,
  AbstractTypeFilterDefinition,
} from '@mathesar/stores/abstract-types/types';
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
  filterDefinitions: AbstractTypeFilterDefinition[];
}

export function getProcessedColumn(
  column: Column,
  abstractTypeMap: AbstractTypesMap,
): ProcessedTableColumn {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    abstractTypeMap,
  );
  return {
    column,
    abstractTypeOfColumn,
    cellCap: getCellCap(column, abstractTypeOfColumn.cell),
    dbTypeInputCap: getDbTypeBasedInputCap(column, abstractTypeOfColumn.cell),
    filterDefinitions: getFiltersForAbstractType(
      abstractTypeOfColumn.identifier,
    ),
  };
}

export function getProcessedColumns(
  columns: Column[],
  abstractTypeMap: AbstractTypesMap,
): ProcessedTableColumn[] {
  return columns.map((column) => getProcessedColumn(column, abstractTypeMap));
}
