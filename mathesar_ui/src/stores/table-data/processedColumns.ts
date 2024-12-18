import type { Readable } from 'svelte/store';

import type { Column, ColumnPrivilege } from '@mathesar/api/rpc/columns';
import type { Constraint } from '@mathesar/api/rpc/constraints';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getDbTypeBasedFilterCap,
  getDbTypeBasedInputCap,
  getDisplayFormatter,
  getInitialInputValue,
} from '@mathesar/components/cell-fabric/utils';
import { retrieveFilters } from '@mathesar/components/filter-entry/utils';
import type { Table } from '@mathesar/models/Table';
import {
  getAbstractTypeForDbType,
  type getFiltersForAbstractType,
  getPreprocFunctionsForAbstractType,
} from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypePreprocFunctionDefinition,
} from '@mathesar/stores/abstract-types/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import { findFkConstraintsForColumn } from './constraintsUtils';
import type { RecordSummariesForSheet } from './record-summaries/recordSummaryUtils';

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
  abstractType: AbstractType;
  initialInputValue: unknown;
  inputComponentAndProps: ComponentAndProps;
  filterComponentAndProps: ComponentAndProps;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
  formatCellValue: (
    cellValue: unknown,
    recordSummaries?: RecordSummariesForSheet,
  ) => string | null | undefined;
  currentRolePrivileges: Set<ColumnPrivilege>;
}

/** Maps column ids to processed columns */
export type ProcessedColumns = Map<number, ProcessedColumn>;
export type ProcessedColumnsStore = Readable<ProcessedColumns>;

export function processColumn({
  tableId,
  column,
  columnIndex,
  constraints,
  hasEnhancedPrimaryKeyCell,
}: {
  tableId: Table['oid'];
  column: Column;
  columnIndex: number;
  constraints: Constraint[];
  /**
   * - When true, the primary key cells will be rendered via the PrimaryKeyCell
   *   component, which provides additional functionality (e.g. hyperlink to
   *   record) over the data-type-based cell.
   * - When false, the primary key cells will be rendered via the
   *   data-type-based cell.
   */
  hasEnhancedPrimaryKeyCell?: boolean;
}): ProcessedColumn {
  const abstractType = getAbstractTypeForDbType(column.type);
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
  const fkTargetTableId = linkFk ? linkFk.referent_table_oid : undefined;
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
      fkTargetTableId,
      pkTargetTableId: isPk ? tableId : undefined,
    }),
    inputComponentAndProps: getDbTypeBasedInputCap(
      column,
      fkTargetTableId,
      abstractType.cellInfo,
    ),
    filterComponentAndProps: getDbTypeBasedFilterCap(
      column,
      fkTargetTableId,
      abstractType.cellInfo,
    ),
    allowedFiltersMap: retrieveFilters(abstractType.identifier, linkFk),
    preprocFunctions: getPreprocFunctionsForAbstractType(
      abstractType.identifier,
    ),
    formatCellValue: getDisplayFormatter(column, column.id),
    currentRolePrivileges: new Set(column.current_role_priv),
  };
}
