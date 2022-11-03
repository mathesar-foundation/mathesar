import { ImmutableMap } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type {
  QueryResultColumn,
  QueryRunResponse,
} from '@mathesar/api/queries';
import {
  getAbstractTypeForDbType,
  getFiltersForAbstractType,
  getPreprocFunctionsForAbstractType,
} from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypePreprocFunctionDefinition,
} from '@mathesar/stores/abstract-types/types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
} from '@mathesar/components/cell-fabric/utils';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { TableEntry } from '@mathesar/api/tables';
import type {
  JpPath,
  JoinableTablesResult,
} from '@mathesar/api/tables/joinable_tables';
import type { Column } from '@mathesar/api/tables/columns';
import type QueryModel from './QueryModel';

export type ColumnOperationalState =
  | {
      state: 'processing';
      processType?: 'creation' | 'deletion' | 'modification';
    }
  | { state: 'success' }
  | { state: 'failure'; errors: string[] };

export interface ProcessedQueryResultColumn extends CellColumnFabric {
  id: QueryResultColumn['alias'];
  column: QueryResultColumn;
  abstractType: AbstractType;
  inputComponentAndProps: ComponentAndProps;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
  // Make this mandatory later
  operationalState?: ColumnOperationalState;
}

export interface ProcessedQueryOutputColumn extends ProcessedQueryResultColumn {
  columnIndex: number;
}

export type ProcessedQueryResultColumnMap = ImmutableMap<
  ProcessedQueryResultColumn['id'],
  ProcessedQueryResultColumn
>;

export type ProcessedQueryOutputColumnMap = ImmutableMap<
  ProcessedQueryOutputColumn['id'],
  ProcessedQueryOutputColumn
>;

export interface InputColumn {
  id: Column['id'];
  name: Column['name'];
  tableName: TableEntry['name'];
  jpPath?: JpPath;
  type: Column['type'];
  tableId: TableEntry['id'];
}

export interface ColumnWithLink extends Omit<InputColumn, 'tableId'> {
  type: Column['type'];
  linksTo?: LinkedTable;
}

export interface LinkedTable {
  id: TableEntry['id'];
  name: TableEntry['name'];
  linkedToColumn: {
    id: Column['id'];
    name: Column['name'];
  };
  columns: Map<ColumnWithLink['id'], ColumnWithLink>;
}

export interface ReferencedByTable extends LinkedTable {
  referencedViaColumn: {
    id: Column['id'];
    name: Column['name'];
    type: Column['type'];
  };
}

export interface InputColumnsStoreSubstance {
  baseTableColumns: Map<ColumnWithLink['id'], ColumnWithLink>;
  tablesThatReferenceBaseTable: Map<ReferencedByTable['id'], ReferencedByTable>;
  inputColumnInformationMap: Map<InputColumn['id'], InputColumn>;
}

// Inorder to place all columns with links at the end while sorting
const compareColumnByLinks = (
  a: [ColumnWithLink['id'], ColumnWithLink],
  b: [ColumnWithLink['id'], ColumnWithLink],
) => {
  if (a[1].linksTo && !b[1].linksTo) {
    return 1;
  }
  if (!a[1].linksTo && b[1].linksTo) {
    return -1;
  }
  return 0;
};

export function getLinkFromColumn(
  result: JoinableTablesResult,
  columnId: Column['id'],
  depth: number,
): LinkedTable | undefined {
  const validLinks = result.joinable_tables.filter(
    (entry) =>
      entry.depth === depth &&
      entry.fk_path[depth - 1][1] === false &&
      entry.jp_path[depth - 1][0] === columnId,
  );
  if (validLinks.length === 0) {
    return undefined;
  }
  if (validLinks.length > 1) {
    // This scenario should never occur
    throw new Error(`Multiple links present for the same column: ${columnId}`);
  }
  const link = validLinks[0];
  const toTableInfo = result.tables[link.target];
  const toTable = {
    id: link.target,
    name: toTableInfo.name,
  };
  const toColumnId = link.jp_path[depth - 1][1];
  const toColumn = {
    id: toColumnId,
    name: result.columns[toColumnId].name,
  };
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    toTableInfo.columns.map((columnIdInLinkedTable) => {
      const columnInLinkedTable = result.columns[columnIdInLinkedTable];
      return [
        columnIdInLinkedTable,
        {
          id: columnIdInLinkedTable,
          name: columnInLinkedTable.name,
          tableName: toTableInfo.name,
          type: columnInLinkedTable.type,
          linksTo: getLinkFromColumn(result, columnIdInLinkedTable, depth + 1),
          jpPath: link.jp_path,
        },
      ];
    });
  return {
    ...toTable,
    linkedToColumn: toColumn,
    columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
  };
}

export function getColumnInformationMap(
  result: JoinableTablesResult,
  baseTable: TableEntry,
): InputColumnsStoreSubstance['inputColumnInformationMap'] {
  const map: InputColumnsStoreSubstance['inputColumnInformationMap'] =
    new Map();
  baseTable.columns.forEach((column) => {
    map.set(column.id, {
      id: column.id,
      name: column.name,
      type: column.type,
      tableId: baseTable.id,
      tableName: baseTable.name,
    });
  });
  Object.keys(result.tables).forEach((tableIdKey) => {
    const tableId = parseInt(tableIdKey, 10);
    const table = result.tables[tableId];
    table.columns.forEach((columnId) => {
      const column = result.columns[columnId];
      map.set(columnId, {
        id: columnId,
        name: column.name,
        type: column.type,
        tableId,
        tableName: table.name,
      });
    });
  });
  return map;
}

export function getBaseTableColumnsWithLinks(
  result: JoinableTablesResult,
  baseTable: TableEntry,
): Map<ColumnWithLink['id'], ColumnWithLink> {
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    baseTable.columns.map((column) => [
      column.id,
      {
        id: column.id,
        name: column.name,
        type: column.type,
        tableName: baseTable.name,
        linksTo: getLinkFromColumn(result, column.id, 1),
      },
    ]);
  return new Map(columnMapEntries.sort(compareColumnByLinks));
}

export function getTablesThatReferenceBaseTable(
  result: JoinableTablesResult,
  baseTable: TableEntry,
): Map<ReferencedByTable['id'], ReferencedByTable> {
  const referenceLinks = result.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fk_path[0][1] === true,
  );
  const references: Map<ReferencedByTable['id'], ReferencedByTable> = new Map();

  referenceLinks.forEach((reference) => {
    const tableId = reference.target;
    const table = result.tables[tableId];
    const baseTableColumnId = reference.jp_path[0][0];
    const baseTableColumn = baseTable.columns.find(
      (column) => column.id === baseTableColumnId,
    );
    const referenceTableColumnId = reference.jp_path[0][1];
    if (!baseTableColumn) {
      return;
    }
    const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
      result.tables[reference.target].columns
        .filter((columnId) => columnId !== referenceTableColumnId)
        .map((columnIdInTable) => {
          const columnInTable = result.columns[columnIdInTable];
          return [
            columnIdInTable,
            {
              id: columnIdInTable,
              name: columnInTable.name,
              type: columnInTable.type,
              tableName: table.name,
              linksTo: getLinkFromColumn(result, columnIdInTable, 2),
              jpPath: reference.jp_path,
            },
          ];
        });

    references.set(tableId, {
      id: tableId,
      name: table.name,
      referencedViaColumn: {
        id: referenceTableColumnId,
        ...result.columns[referenceTableColumnId],
      },
      linkedToColumn: baseTableColumn,
      columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
    });
  });

  return references;
}

/** ======== */

function processColumn(
  columnInfo: Pick<QueryResultColumn, 'alias'> & Partial<QueryResultColumn>,
  abstractTypeMap: AbstractTypesMap,
): ProcessedQueryResultColumn {
  const column = {
    alias: columnInfo.alias,
    display_name: columnInfo.display_name ?? columnInfo.alias,
    type: columnInfo.type ?? 'unknown',
    type_options: columnInfo.type_options ?? null,
    display_options: columnInfo.display_options ?? null,
  };

  const abstractType = getAbstractTypeForDbType(column.type, abstractTypeMap);
  return {
    id: column.alias,
    column,
    abstractType,
    cellComponentAndProps: getCellCap({
      cellInfo: abstractType.cellInfo,
      column,
    }),
    inputComponentAndProps: getDbTypeBasedInputCap(
      column,
      undefined,
      abstractType.cellInfo,
    ),
    allowedFiltersMap: getFiltersForAbstractType(abstractType.identifier),
    preprocFunctions: getPreprocFunctionsForAbstractType(
      abstractType.identifier,
    ),
  };
}

export function processColumnMetaData(
  columnMetaData: QueryRunResponse['column_metadata'],
  abstractTypeMap: AbstractTypesMap,
): ProcessedQueryResultColumnMap {
  return new ImmutableMap(
    Object.entries(columnMetaData).map(([alias, columnMeta]) => [
      alias,
      processColumn(columnMeta, abstractTypeMap),
    ]),
  );
}

export function speculateColumnMetaData({
  currentProcessedColumnsMetaData,
  inputColumnInformationMap,
  queryModel,
  abstractTypeMap,
}: {
  currentProcessedColumnsMetaData: ProcessedQueryResultColumnMap;
  inputColumnInformationMap: InputColumnsStoreSubstance['inputColumnInformationMap'];
  queryModel: QueryModel;
  abstractTypeMap: AbstractTypesMap;
}): ProcessedQueryResultColumnMap {
  const initialColumns = queryModel.initial_columns;
  const summarizationTransforms = queryModel.getSummarizationTransforms();
  const initialColumnsRequiringChange = initialColumns.filter(
    (column) =>
      !currentProcessedColumnsMetaData.has(column.alias) ||
      currentProcessedColumnsMetaData.get(column.alias)?.column.display_name !==
        column.display_name,
  );
  const summarizationTransformsWithoutMetaData = summarizationTransforms.filter(
    (transformation) =>
      transformation
        .getOutputColumnAliases()
        .some(
          (outputAlias) => !currentProcessedColumnsMetaData.has(outputAlias),
        ),
  );
  let updatedColumnsMetaData = currentProcessedColumnsMetaData;
  const isUpdateRequired =
    initialColumnsRequiringChange.length > 0 ||
    summarizationTransformsWithoutMetaData.length > 0;
  if (initialColumnsRequiringChange.length > 0) {
    initialColumnsRequiringChange.forEach((initialColumn) => {
      updatedColumnsMetaData = updatedColumnsMetaData.with(
        initialColumn.alias,
        processColumn(
          {
            alias: initialColumn.alias,
            display_name: initialColumn.display_name,
            type: inputColumnInformationMap.get(initialColumn.id)?.type,
          },
          abstractTypeMap,
        ),
      );
    });
  }
  if (summarizationTransformsWithoutMetaData.length > 0) {
    summarizationTransformsWithoutMetaData.forEach((transform) => {
      [...transform.aggregations.values()].forEach((aggregation) => {
        if (!updatedColumnsMetaData.has(aggregation.outputAlias)) {
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            aggregation.outputAlias,
            processColumn(
              {
                alias: aggregation.outputAlias,
                display_name: aggregation.displayName,
                type:
                  aggregation.function === 'aggregate_to_array'
                    ? '_array'
                    : 'integer',
                type_options:
                  aggregation.function === 'aggregate_to_array'
                    ? {
                        type:
                          updatedColumnsMetaData.get(aggregation.inputAlias)
                            ?.column.type ?? 'unknown',
                      }
                    : null,
                display_options: null,
              },
              abstractTypeMap,
            ),
          );
        }
      });
    });
  }
  return isUpdateRequired
    ? new ImmutableMap(updatedColumnsMetaData)
    : currentProcessedColumnsMetaData;
}

export function getProcessedOutputColumns(
  outputColumnAliases: QueryRunResponse['output_columns'],
  processedColumnMetaData: ProcessedQueryResultColumnMap,
): ProcessedQueryOutputColumnMap {
  return new ImmutableMap(
    outputColumnAliases.map((alias, index) => [
      alias,
      {
        ...(processedColumnMetaData.get(alias) ??
          processColumn({ alias }, new Map())),
        columnIndex: index,
      },
    ]),
  );
}
