import type {
  ComponentAndProps,
  ImmutableMap,
} from '@mathesar-component-library/types';
import type { QueryResultColumn } from '@mathesar/api/queries/queryList';
import {
  getAbstractTypeForDbType,
  getFiltersForAbstractType,
} from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
} from '@mathesar/components/cell-fabric/utils';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';

export interface ProcessedQueryResultColumn extends CellColumnFabric {
  id: QueryResultColumn['alias'];
  column: QueryResultColumn;
  abstractType: AbstractType;
  inputComponentAndProps: ComponentAndProps;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
}

export type ProcessedQueryResultColumnMap = ImmutableMap<
  ProcessedQueryResultColumn['id'],
  ProcessedQueryResultColumn
>;

export function processColumn(
  column: QueryResultColumn,
  abstractTypeMap: AbstractTypesMap,
): ProcessedQueryResultColumn {
  const abstractType = getAbstractTypeForDbType(column.type, abstractTypeMap);
  return {
    id: column.alias,
    column,
    abstractType,
    cellComponentAndProps: getCellCap(abstractType.cell, column),
    inputComponentAndProps: getDbTypeBasedInputCap(column, abstractType.cell),
    allowedFiltersMap: getFiltersForAbstractType(abstractType.identifier),
  };
}
