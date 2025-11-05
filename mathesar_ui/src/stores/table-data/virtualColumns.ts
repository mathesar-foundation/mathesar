import type { JoinableTablesResult, JoinPath } from '@mathesar/api/rpc/tables';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getDisplayFormatter,
} from '@mathesar/components/cell-fabric/utils';
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

import type {
  AggregationType,
  RelatedColumnEntry,
  RelatedColumns,
} from './relatedColumns';
import type { RecordSummariesForSheet } from './record-summaries/recordSummaryUtils';

/**
 * A virtual column that represents data from a related table.
 * Similar to ProcessedColumn but for columns that don't exist in the current table.
 */
export class VirtualColumn implements CellColumnFabric {
  readonly id: number | string;

  readonly column: {
    id: number | string;
    name: string;
    type: string;
    type_options: null;
    description: string | null;
    nullable: boolean;
    primary_key: boolean;
    metadata: null;
    current_role_priv: string[];
  };

  readonly columnIndex: number;

  readonly tableOid: number;

  readonly isVirtual = true;

  readonly sourceTableName: string;

  readonly sourceColumnName: string;

  readonly joinPath: JoinPath;

  readonly multipleResults: boolean;

  readonly aggregation?: AggregationType;

  readonly abstractType: AbstractType;

  readonly cellComponentAndProps: ComponentAndProps;

  readonly inputComponentAndProps: ComponentAndProps;

  readonly simpleInputComponentAndProps: ComponentAndProps;

  readonly allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;

  readonly preprocFunctions: AbstractTypePreprocFunctionDefinition[];

  formatCellValue: (
    cellValue: unknown,
    recordSummaries?: RecordSummariesForSheet,
  ) => string | null | undefined;

  readonly currentRolePrivileges: Set<string>;

  readonly isEditable = true; // Will be editable in the future

  readonly initialInputValue = null;

  constructor(props: {
    entry: RelatedColumnEntry;
    joinableTablesResult: JoinableTablesResult;
    columnIndex: number;
    baseTableOid: number;
  }) {
    const { entry, joinableTablesResult, columnIndex, baseTableOid } = props;

    // Find the target table info
    // The join path is [[table_oid, column_attnum][][]], so the last entry has the final table
    const targetTableOid = entry.joinPath[entry.joinPath.length - 1][0][0];
    const tableInfo = joinableTablesResult.target_table_info[String(targetTableOid)];

    if (!tableInfo) {
      throw new Error(
        `Table info not found for OID ${targetTableOid} in join path`,
      );
    }

    // Column IDs in target_table_info.columns are stringified attnums
    const columnInfo = tableInfo.columns[String(entry.columnId)];

    if (!columnInfo) {
      throw new Error(
        `Column info not found for column ID ${entry.columnId} (attnum) in table ${tableInfo.name} (OID ${targetTableOid})`,
      );
    }

    this.sourceTableName = tableInfo.name;
    this.sourceColumnName = columnInfo.name;
    this.joinPath = entry.joinPath;
    this.multipleResults = entry.multipleResults;
    this.aggregation = entry.aggregation;
    this.tableOid = baseTableOid;
    this.columnIndex = columnIndex;

    // Create a unique ID for this virtual column
    // Using a string to differentiate from real column IDs (which are numbers)
    this.id = `virtual_${JSON.stringify(entry.joinPath)}_${entry.columnId}`;

    // Create a column-like object
    this.column = {
      id: this.id,
      name: `${this.sourceTableName} → ${this.sourceColumnName}`,
      type: columnInfo.type,
      type_options: null,
      description: null,
      nullable: true,
      primary_key: false,
      metadata: null,
      current_role_priv: ['SELECT'], // Virtual columns are read-only for now
    };

    this.abstractType = getAbstractTypeForDbType(this.column.type, null);

    // Use the cell capabilities from the abstract type
    const cellCap = getCellCap({
      cellInfo: this.abstractType.cellInfo,
      column: this.column,
    });
    this.cellComponentAndProps = cellCap;
    this.inputComponentAndProps = cellCap;
    this.simpleInputComponentAndProps = cellCap;

    this.allowedFiltersMap = new Map();
    this.preprocFunctions = getPreprocFunctionsForAbstractType(
      this.abstractType.identifier,
    );

    this.formatCellValue = getDisplayFormatter(this.column);

    this.currentRolePrivileges = new Set(['SELECT']);
  }

  /**
   * Checks if a column ID belongs to a virtual column
   */
  static isVirtualColumnId(id: number | string): boolean {
    return typeof id === 'string' && id.startsWith('virtual_');
  }
}

/**
 * Builds virtual column definitions from related columns state
 */
export function buildVirtualColumnsFromRelatedColumns(
  relatedColumns: RelatedColumns,
  joinableTablesResult: JoinableTablesResult | undefined,
  baseTableOid: number,
  startingIndex: number,
): VirtualColumn[] {
  if (!joinableTablesResult || relatedColumns.entries.length === 0) {
    return [];
  }

  const virtualColumns: VirtualColumn[] = [];
  let index = 0;

  for (const entry of relatedColumns.entries) {
    try {
      virtualColumns.push(
        new VirtualColumn({
          entry,
          joinableTablesResult,
          columnIndex: startingIndex + index,
          baseTableOid,
        }),
      );
      index++;
    } catch (error) {
      // Skip invalid entries - they might be from tables/columns that no longer exist
      console.warn('Failed to build virtual column:', error);
    }
  }

  return virtualColumns;
}
