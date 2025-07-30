import { execPipe, find, map } from 'iter-tools';
import type { Readable } from 'svelte/store';

import type {
  ColumnPrivilege,
  RawColumnWithMetadata,
} from '@mathesar/api/rpc/columns';
import type {
  FkConstraint,
  RawConstraint,
} from '@mathesar/api/rpc/constraints';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getDbTypeBasedFilterCap,
  getDbTypeBasedInputCap,
  getDisplayFormatter,
  getInitialInputValue,
  getLinkedRecordInputCap,
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
import { makeRecordSelectorOrchestratorFactory } from '@mathesar/systems/record-selector/recordSelectorOrchestrator';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import { findFkConstraintsForColumn } from './constraintsUtils';
import type { RecordSummariesForSheet } from './record-summaries/recordSummaryUtils';

/**
 * Prefer properties over functions in this class since we use these properties in
 * each cell and the class is immutable.
 */
export class ProcessedColumn implements CellColumnFabric {
  /**
   * This property is also available via `column.id`, but it's duplicated at a
   * higher level for brevity's sake because it's used so frequently.
   */
  readonly id: RawColumnWithMetadata['id'];

  readonly column: RawColumnWithMetadata;

  readonly columnIndex: number;

  readonly tableOid: Table['oid'];

  /** All constriants relevant to this column */
  readonly relevantConstraints: RawConstraint[];

  /** Constraints whose columns include only this column */
  readonly exclusiveConstraints: RawConstraint[];

  /** Constraints whose columns include this column and other columns too */
  readonly sharedConstraints: RawConstraint[];

  readonly abstractType: AbstractType;

  readonly initialInputValue: unknown;

  readonly linkFk?: FkConstraint;

  readonly hasEnhancedPrimaryKeyCell: boolean;

  readonly cellComponentAndProps: ComponentAndProps;

  readonly inputComponentAndProps: ComponentAndProps;

  readonly filterComponentAndProps: ComponentAndProps;

  readonly allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;

  readonly preprocFunctions: AbstractTypePreprocFunctionDefinition[];

  formatCellValue: (
    cellValue: unknown,
    recordSummaries?: RecordSummariesForSheet,
  ) => string | null | undefined;

  readonly currentRolePrivileges: Set<ColumnPrivilege>;

  readonly isEditable: boolean;

  constructor(props: {
    tableOid: Table['oid'];
    column: RawColumnWithMetadata;
    columnIndex: number;
    constraints: RawConstraint[];
    hasEnhancedPrimaryKeyCell?: boolean;
  }) {
    this.id = props.column.id;
    this.column = props.column;
    this.columnIndex = props.columnIndex;
    this.tableOid = props.tableOid;
    this.hasEnhancedPrimaryKeyCell = props.hasEnhancedPrimaryKeyCell ?? true;

    this.relevantConstraints = props.constraints.filter((c) =>
      c.columns.includes(this.column.id),
    );
    this.exclusiveConstraints = this.relevantConstraints.filter(
      (c) => c.columns.length === 1,
    );
    this.sharedConstraints = this.relevantConstraints.filter(
      (c) => c.columns.length !== 1,
    );

    this.abstractType = getAbstractTypeForDbType(this.column.type);

    this.initialInputValue = getInitialInputValue(
      this.column,
      undefined,
      this.abstractType.cellInfo,
    );

    [this.linkFk] = findFkConstraintsForColumn(
      this.exclusiveConstraints,
      this.column.id,
    );

    const displayEnhancedPkCell =
      this.hasEnhancedPrimaryKeyCell && this.column.primary_key;
    const fkTargetTableId = this.linkFk
      ? this.linkFk.referent_table_oid
      : undefined;

    this.cellComponentAndProps = getCellCap({
      cellInfo: this.abstractType.cellInfo,
      column: this.column,
      fkTargetTableId,
      pkTargetTableId: displayEnhancedPkCell ? this.tableOid : undefined,
    });

    this.inputComponentAndProps = fkTargetTableId
      ? getLinkedRecordInputCap({
          recordSelectionOrchestratorFactory:
            makeRecordSelectorOrchestratorFactory({
              tableOid: fkTargetTableId,
            }),
          targetTableId: fkTargetTableId,
        })
      : getDbTypeBasedInputCap(this.column, this.abstractType.cellInfo);

    this.filterComponentAndProps =
      getDbTypeBasedFilterCap(this.column, this.abstractType.cellInfo) ??
      this.inputComponentAndProps;

    this.allowedFiltersMap = retrieveFilters(
      this.abstractType.identifier,
      this.linkFk,
    );

    this.preprocFunctions = getPreprocFunctionsForAbstractType(
      this.abstractType.identifier,
    );

    this.formatCellValue = getDisplayFormatter(this.column, this.column.id);

    this.currentRolePrivileges = new Set(this.column.current_role_priv);

    this.isEditable = (() => {
      const currRoleHasEditPrivileges =
        this.currentRolePrivileges.has('UPDATE');
      if (!currRoleHasEditPrivileges) {
        return false;
      }
      const hasDynamicDefault = !!this.column.default?.is_dynamic;
      const isPk = !!this.column.primary_key;
      if (isPk) {
        return !this.hasEnhancedPrimaryKeyCell && !hasDynamicDefault;
      }
      return true;
    })();
  }

  withoutEnhancedPkCell() {
    return new ProcessedColumn({
      tableOid: this.tableOid,
      column: this.column,
      columnIndex: this.columnIndex,
      constraints: this.relevantConstraints,
      hasEnhancedPrimaryKeyCell: false,
    });
  }
}

export function getFirstEditableColumn(
  columns: Iterable<ProcessedColumn>,
): ProcessedColumn | undefined {
  return execPipe(
    columns,
    map((c) => c.withoutEnhancedPkCell()),
    find((c) => c.isEditable),
  );
}

/** Maps column ids to processed columns */
export type ProcessedColumns = Map<number, ProcessedColumn>;
export type ProcessedColumnsStore = Readable<ProcessedColumns>;
