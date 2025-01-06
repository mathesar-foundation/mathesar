import { api } from '@mathesar/api/rpc';
import type { Column } from '@mathesar/api/rpc/columns';
import type {
  ExplorationResult,
  QueryColumnMetaData,
  QueryGeneratedColumnSource,
  QueryInitialColumnSource,
  QueryResultColumn,
} from '@mathesar/api/rpc/explorations';
import type { JoinPath, JoinableTablesResult } from '@mathesar/api/rpc/tables';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getDbTypeBasedFilterCap,
  getDbTypeBasedInputCap,
  getDisplayFormatter,
  getInitialInputValue,
} from '@mathesar/components/cell-fabric/utils';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import { batchRun } from '@mathesar/packages/json-rpc-client-builder';
import {
  getAbstractTypeForDbType,
  getFiltersForAbstractType,
  getPreprocFunctionsForAbstractType,
  getSummarizationFunctionsForAbstractType,
} from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypePreprocFunctionDefinition,
  AbstractTypeSummarizationFunction,
} from '@mathesar/stores/abstract-types/types';
import { ImmutableMap } from '@mathesar-component-library';
import type {
  CancellablePromise,
  ComponentAndProps,
} from '@mathesar-component-library/types';

import type QueryModel from './QueryModel';

type ProcessedQueryResultColumnSource =
  | (Pick<QueryInitialColumnSource, 'is_initial_column'> &
      Partial<QueryInitialColumnSource>)
  | QueryGeneratedColumnSource;

export interface ProcessedQueryResultColumn extends CellColumnFabric {
  id: QueryColumnMetaData['alias'];
  column: QueryResultColumn;
  abstractType: AbstractType;
  inputComponentAndProps: ComponentAndProps;
  filterComponentAndProps: ComponentAndProps;
  initialInputValue: unknown;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
  summarizationFunctions: AbstractTypeSummarizationFunction[];
  source: ProcessedQueryResultColumnSource;
  formatCellValue: (cellValue: unknown) => string | null | undefined;
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
  tableName: Table['name'];
  jpPath?: JoinPath;
  type: Column['type'];
  tableId: Table['oid'];
}

export interface ColumnWithLink extends Omit<InputColumn, 'tableId'> {
  type: Column['type'];
  linksTo?: LinkedTable;
  producesMultipleResults: boolean;
}

export interface LinkedTable {
  id: Table['oid'];
  name: Table['name'];
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
  tablesThatReferenceBaseTable: ReferencedByTable[];
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
  parentPath = '',
): LinkedTable | undefined {
  const allLinksFromColumn = result.joinable_tables.filter(
    (entry) =>
      entry.depth === depth &&
      entry.fkey_path[depth - 1][1] === false &&
      entry.join_path[depth - 1][0][1] === columnId &&
      entry.join_path.join(',').indexOf(parentPath) === 0,
  );
  if (allLinksFromColumn.length === 0) {
    return undefined;
  }
  if (allLinksFromColumn.length > 1) {
    // This scenario should never occur
    throw new Error(`Multiple links present for the same column: ${columnId}`);
  }
  const link = allLinksFromColumn[0];
  const toTableInfo = result.target_table_info[link.target];
  const toTable = {
    id: link.target,
    name: toTableInfo.name,
  };
  const toColumnId = link.join_path[depth - 1][1][1];
  const toColumn = {
    id: toColumnId,
    name: toTableInfo.columns[toColumnId].name,
  };
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    Object.entries(toTableInfo.columns).map(([id, columnInLinkedTable]) => {
      const columnIdInLinkedTable = parseInt(id, 10);
      return [
        columnIdInLinkedTable,
        {
          id: columnIdInLinkedTable,
          name: columnInLinkedTable.name,
          tableName: toTableInfo.name,
          type: columnInLinkedTable.type,
          linksTo: getLinkFromColumn(
            result,
            columnIdInLinkedTable,
            depth + 1,
            link.join_path.join(','),
          ),
          jpPath: link.join_path,
          producesMultipleResults: link.multiple_results,
        },
      ];
    });
  return {
    ...toTable,
    linkedToColumn: toColumn,
    columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
  };
}

export interface QueryTableStructure {
  joinableTables: JoinableTablesResult;
  baseTable: Pick<Table, 'oid' | 'name'>;
  columns: Pick<Column, 'id' | 'name' | 'type'>[];
}

export function getQueryTableStructure(p: {
  database: Pick<Database, 'id'>;
  baseTableId: Table['oid'];
}): CancellablePromise<QueryTableStructure> {
  const args = {
    database_id: p.database.id,
    table_oid: p.baseTableId,
  };
  return batchRun([
    api.tables.list_joinable(args),
    api.tables.get(args),
    api.columns.list(args),
  ]).transformResolved(([joinableTables, baseTable, columns]) => ({
    joinableTables,
    baseTable,
    columns,
  }));
}

function getColumnInformationMap({
  joinableTables,
  baseTable,
  columns,
}: QueryTableStructure): InputColumnsStoreSubstance['inputColumnInformationMap'] {
  const map: InputColumnsStoreSubstance['inputColumnInformationMap'] =
    new Map();
  columns.forEach((column) => {
    map.set(column.id, {
      id: column.id,
      name: column.name,
      type: column.type,
      tableId: baseTable.oid,
      tableName: baseTable.name,
    });
  });
  for (const [tableIdKey, table] of Object.entries(
    joinableTables.target_table_info,
  )) {
    const tableId = parseInt(tableIdKey, 10);
    for (const [columnIdKey, column] of Object.entries(table.columns)) {
      const columnId = parseInt(columnIdKey, 10);
      map.set(columnId, {
        id: columnId,
        name: column.name,
        type: column.type,
        tableId,
        tableName: table.name,
      });
    }
  }
  return map;
}

function getBaseTableColumnsWithLinks({
  joinableTables,
  baseTable,
  columns,
}: QueryTableStructure): Map<ColumnWithLink['id'], ColumnWithLink> {
  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
    columns.map(({ id, name, type }) => [
      id,
      {
        id,
        name,
        type,
        tableName: baseTable.name,
        linksTo: getLinkFromColumn(joinableTables, id, 1),
        producesMultipleResults: false,
      },
    ]);
  return new Map(columnMapEntries.sort(compareColumnByLinks));
}

function getTablesThatReferenceBaseTable({
  joinableTables,
  baseTable,
  columns,
}: QueryTableStructure): ReferencedByTable[] {
  const links = joinableTables.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fkey_path[0][1] === true,
  );
  const references: ReferencedByTable[] = [];

  for (const link of links) {
    const baseTableColumnId = link.join_path[0][0][1];
    const referenceTableColumnId = link.join_path[0][1][1];

    const baseTableColumn = columns.find((c) => c.id === baseTableColumnId);
    if (!baseTableColumn) continue;
    const targetTableId = link.target;
    const targetTable = joinableTables.target_table_info[targetTableId];
    const targetTableColumn = targetTable.columns[referenceTableColumnId];
    const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
      Object.entries(targetTable.columns)
        .filter(([columnId]) => columnId !== String(referenceTableColumnId))
        .map(([columnIdKey, column]) => {
          const columnId = parseInt(columnIdKey, 10);
          const parentPath = link.join_path.join(',');
          return [
            columnId,
            {
              id: columnId,
              name: column.name,
              type: column.type,
              tableName: baseTable.name,
              linksTo: getLinkFromColumn(
                joinableTables,
                columnId,
                2,
                parentPath,
              ),
              jpPath: link.join_path,
              producesMultipleResults: link.multiple_results,
            },
          ];
        });

    references.push({
      id: targetTableId,
      name: targetTable.name,
      referencedViaColumn: {
        id: referenceTableColumnId,
        name: targetTableColumn.name,
        type: targetTableColumn.type,
      },
      linkedToColumn: baseTableColumn,
      columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
    });
  }

  return references;
}

export function getInputColumns(
  s: QueryTableStructure,
): InputColumnsStoreSubstance {
  return {
    baseTableColumns: getBaseTableColumnsWithLinks(s),
    tablesThatReferenceBaseTable: getTablesThatReferenceBaseTable(s),
    inputColumnInformationMap: getColumnInformationMap(s),
  };
}

function processColumn(
  columnInfo: Pick<QueryColumnMetaData, 'alias'> &
    ProcessedQueryResultColumnSource &
    Partial<QueryColumnMetaData>,
): ProcessedQueryResultColumn {
  const column: QueryResultColumn = {
    alias: columnInfo.alias,
    display_name: columnInfo.display_name ?? columnInfo.alias,
    type: columnInfo.type ?? 'unknown',
    type_options: columnInfo.type_options ?? null,
    metadata: columnInfo.metadata ?? null,
  };

  const abstractType = getAbstractTypeForDbType(column.type);
  const source: ProcessedQueryResultColumnSource = columnInfo.is_initial_column
    ? {
        is_initial_column: true,
        input_column_name: columnInfo.input_column_name,
        input_table_name: columnInfo.input_table_name,
        input_table_id: columnInfo.input_table_id,
      }
    : {
        is_initial_column: false,
        input_alias: columnInfo.input_alias,
      };
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
    filterComponentAndProps: getDbTypeBasedFilterCap(
      column,
      undefined,
      abstractType.cellInfo,
    ),
    initialInputValue: getInitialInputValue(
      column,
      undefined,
      abstractType.cellInfo,
    ),
    allowedFiltersMap: getFiltersForAbstractType(abstractType.identifier),
    preprocFunctions: getPreprocFunctionsForAbstractType(
      abstractType.identifier,
    ),
    summarizationFunctions: getSummarizationFunctionsForAbstractType(
      abstractType.identifier,
    ),
    source,
    formatCellValue: getDisplayFormatter(column),
  };
}

export function processColumnMetaData(
  columnMetaData: ExplorationResult['column_metadata'],
): ProcessedQueryResultColumnMap {
  return new ImmutableMap(
    Object.entries(columnMetaData).map(([alias, columnMeta]) => [
      alias,
      processColumn(columnMeta),
    ]),
  );
}

export function speculateColumnMetaData({
  currentProcessedColumnsMetaData,
  inputColumnInformationMap,
  queryModel,
}: {
  currentProcessedColumnsMetaData: ProcessedQueryResultColumnMap;
  inputColumnInformationMap: InputColumnsStoreSubstance['inputColumnInformationMap'];
  queryModel: QueryModel;
}): ProcessedQueryResultColumnMap {
  const initialColumns = queryModel.initial_columns;
  const summarizationTransforms = queryModel.getSummarizationTransforms();
  const initialColumnsWithoutMetaData = initialColumns.filter(
    (column) => !currentProcessedColumnsMetaData.has(column.alias),
  );
  const summarizationTransformsWithoutMetaData = summarizationTransforms.filter(
    (transformation) =>
      transformation
        .getOutputColumnAliases()
        .some(
          (outputAlias) => !currentProcessedColumnsMetaData.has(outputAlias),
        ),
  );
  // Only change display names for columns present in meta data
  const displayNamesRequiringChange = Object.entries(
    queryModel.display_names,
  ).filter(
    ([alias, displayName]) =>
      currentProcessedColumnsMetaData.has(alias) &&
      currentProcessedColumnsMetaData.get(alias)?.column.display_name !==
        displayName,
  );
  let updatedColumnsMetaData = currentProcessedColumnsMetaData;
  let isUpdateRequired =
    initialColumnsWithoutMetaData.length > 0 ||
    summarizationTransformsWithoutMetaData.length > 0;
  if (initialColumnsWithoutMetaData.length > 0) {
    initialColumnsWithoutMetaData.forEach((initialColumn) => {
      const inputColumnInformation = inputColumnInformationMap.get(
        initialColumn.attnum,
      );
      updatedColumnsMetaData = updatedColumnsMetaData.with(
        initialColumn.alias,
        processColumn({
          alias: initialColumn.alias,
          type: inputColumnInformation?.type,
          is_initial_column: true,
          input_column_name: inputColumnInformation?.name,
          input_table_name: inputColumnInformation?.tableName,
          input_table_id: inputColumnInformation?.tableId,
        }),
      );
    });
  }
  if (summarizationTransformsWithoutMetaData.length > 0) {
    summarizationTransformsWithoutMetaData.forEach((transform) => {
      [...transform.groups.values()].forEach((group) => {
        if (!updatedColumnsMetaData.has(group.outputAlias)) {
          const inputColumn = updatedColumnsMetaData.get(group.inputAlias)
            ?.column;
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            group.outputAlias,
            processColumn({
              alias: group.outputAlias,
              display_name: null,
              type: inputColumn?.type ?? 'unknown',
              type_options: inputColumn?.type_options ?? null,
              metadata: inputColumn?.metadata ?? null,
              is_initial_column: false,
              input_alias: group.inputAlias,
            }),
          );
        }
      });
      [...transform.aggregations.values()].forEach((aggregation) => {
        if (!updatedColumnsMetaData.has(aggregation.outputAlias)) {
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            aggregation.outputAlias,
            processColumn({
              alias: aggregation.outputAlias,
              type:
                aggregation.function === 'distinct_aggregate_to_array'
                  ? '_array'
                  : 'integer',
              type_options:
                aggregation.function === 'distinct_aggregate_to_array'
                  ? {
                      item_type:
                        updatedColumnsMetaData.get(aggregation.inputAlias)
                          ?.column.type ?? 'unknown',
                    }
                  : null,
              metadata: null,
              is_initial_column: false,
              input_alias: aggregation.inputAlias,
            }),
          );
        }
      });
    });
  }
  if (displayNamesRequiringChange.length > 0) {
    displayNamesRequiringChange.forEach(([alias, displayName]) => {
      const columnMetaData = updatedColumnsMetaData.get(alias);
      if (columnMetaData) {
        updatedColumnsMetaData = updatedColumnsMetaData.with(alias, {
          ...columnMetaData,
          column: {
            ...columnMetaData.column,
            display_name: displayName,
          },
        });
        isUpdateRequired = true;
      }
    });
  }
  return isUpdateRequired
    ? new ImmutableMap(updatedColumnsMetaData)
    : currentProcessedColumnsMetaData;
}

export function getProcessedOutputColumns(
  outputColumnAliases: ExplorationResult['output_columns'],
  processedColumnMetaData: ProcessedQueryResultColumnMap,
): ProcessedQueryOutputColumnMap {
  return new ImmutableMap(
    outputColumnAliases.map((alias, index) => [
      alias,
      {
        ...(processedColumnMetaData.get(alias) ??
          processColumn({ alias, is_initial_column: true })),
        columnIndex: index,
      },
    ]),
  );
}
