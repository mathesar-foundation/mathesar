import type { Readable } from 'svelte/store';
import type { Column } from '@mathesar/api/types/tables/columns';
import type {
  Constraint,
  FkConstraint,
} from '@mathesar/api/types/tables/constraints';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypePreprocFunctionDefinition,
} from '@mathesar/stores/abstract-types/types';
import {
  getFiltersForAbstractType,
  getAbstractTypeForDbType,
  getPreprocFunctionsForAbstractType,
} from '@mathesar/stores/abstract-types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
  getInitialInputValue,
} from '@mathesar/components/cell-fabric/utils';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { TableEntry } from '@mathesar/api/types/tables';
import { retrieveFilters } from '@mathesar/components/filter-entry/utils';
import { findFkConstraintsForColumn } from './constraintsUtils';

export interface ProcessedColumn extends CellColumnFabric {
  /**
   * This property is also available via `column.id`, but it's duplicated at a
   * higher level for brevity's sake because it's used so frequently.
   */
  id: Column['id'];
  column: Column;
  columnIndex: number;
  /** Constraints whose columns include only this column */
  exclusiveConstraints: Constraint[];
  /** Constraints whose columns include this column and other columns too */
  sharedConstraints: Constraint[];
  /**
   * Present when this column has one single-column FK constraint. In the
   * unlikely (but theoretically possible) scenario that this column has more
   * than one FK constraint, the first FK constraint is used.
   */
  linkFk: FkConstraint | undefined;
  abstractType: AbstractType;
  initialInputValue: unknown;
  inputComponentAndProps: ComponentAndProps;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
}

/** Maps column ids to processed columns */
export type ProcessedColumnsStore = Readable<Map<number, ProcessedColumn>>;

export function processColumn({
  tableId,
  column,
  columnIndex,
  constraints,
  abstractTypeMap,
  hasEnhancedPrimaryKeyCell,
}: {
  tableId: TableEntry['id'];
  column: Column;
  columnIndex: number;
  constraints: Constraint[];
  abstractTypeMap: AbstractTypesMap;
  /**
   * - When true, the primary key cells will be rendered via the PrimaryKeyCell
   *   component, which provides additional functionality (e.g. hyperlink to
   *   record) over the data-type-based cell.
   * - When false, the primary key cells will be rendered via the
   *   data-type-based cell.
   */
  hasEnhancedPrimaryKeyCell?: boolean;
}): ProcessedColumn {
  const abstractType = getAbstractTypeForDbType(column.type, abstractTypeMap);
  const relevantConstraints = constraints.filter((c) =>
    c.columns.includes(column.id),
  );
  const exclusiveConstraints = relevantConstraints.filter(
    (c) => c.columns.length === 1,
  );
  const sharedConstraints = relevantConstraints.filter(
    (c) => c.columns.length !== 1,
  );
  const linkFk = findFkConstraintsForColumn(exclusiveConstraints, column.id)[0];
  const isPk = (hasEnhancedPrimaryKeyCell ?? true) && column.primary_key;
  return {
    id: column.id,
    column,
    columnIndex,
    exclusiveConstraints,
    sharedConstraints,
    linkFk,
    abstractType,
    initialInputValue: getInitialInputValue(
      column,
      undefined,
      abstractType.cellInfo,
    ),
    cellComponentAndProps: getCellCap({
      cellInfo: abstractType.cellInfo,
      column,
      fkTargetTableId: linkFk ? linkFk.referent_table : undefined,
      pkTargetTableId: isPk ? tableId : undefined,
    }),
    inputComponentAndProps: getDbTypeBasedInputCap(
      column,
      linkFk ? linkFk.referent_table : undefined,
      abstractType.cellInfo,
    ),
    allowedFiltersMap: retrieveFilters(abstractType.identifier, linkFk),
    preprocFunctions: getPreprocFunctionsForAbstractType(
      abstractType.identifier,
    ),
  };
}
