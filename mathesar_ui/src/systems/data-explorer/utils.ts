import { ImmutableMap } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type {
  QueryResultColumn,
  QueryColumnMetaData,
  QueryRunResponse,
  QueryInitialColumnSource,
  QueryGeneratedColumnSource,
} from '@mathesar/api/types/queries';
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
  getDisplayFormatter,
  getInitialInputValue,
} from '@mathesar/components/cell-fabric/utils';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import type { TableEntry } from '@mathesar/api/types/tables';
import type {
  JpPath,
  JoinableTablesResult,
} from '@mathesar/api/types/tables/joinable_tables';
import type { Column } from '@mathesar/api/types/tables/columns';
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
  initialInputValue: unknown;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  preprocFunctions: AbstractTypePreprocFunctionDefinition[];
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
  tableName: TableEntry['name'];
  jpPath?: JpPath;
  type: Column['type'];
  tableId: TableEntry['id'];
}

export interface ColumnWithLink extends Omit<InputColumn, 'tableId'> {
  type: Column['type'];
  linksTo?: LinkedTable;
  producesMultipleResults: boolean;
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
      entry.fk_path[depth - 1][1] === false &&
      entry.jp_path[depth - 1][0] === columnId &&
      entry.jp_path.join(',').indexOf(parentPath) === 0,
  );
  if (allLinksFromColumn.length === 0) {
    return undefined;
  }
  if (allLinksFromColumn.length > 1) {
    // This scenario should never occur
    throw new Error(`Multiple links present for the same column: ${columnId}`);
  }
  const link = allLinksFromColumn[0];
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
          linksTo: getLinkFromColumn(
            result,
            columnIdInLinkedTable,
            depth + 1,
            link.jp_path.join(','),
          ),
          jpPath: link.jp_path,
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

export function getColumnInformationMap(
  result: JoinableTablesResult,
  baseTable: Pick<TableEntry, 'id' | 'name' | 'columns'>,
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
  baseTable: Pick<TableEntry, 'id' | 'name' | 'columns'>,
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
        producesMultipleResults: false,
      },
    ]);
  return new Map(columnMapEntries.sort(compareColumnByLinks));
}

export function getTablesThatReferenceBaseTable(
  result: JoinableTablesResult,
  baseTable: Pick<TableEntry, 'id' | 'name' | 'columns'>,
): ReferencedByTable[] {
  const referenceLinks = result.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fk_path[0][1] === true,
  );
  const references: ReferencedByTable[] = [];

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
              linksTo: getLinkFromColumn(
                result,
                columnIdInTable,
                2,
                reference.jp_path.join(','),
              ),
              jpPath: reference.jp_path,
              producesMultipleResults: reference.multiple_results,
            },
          ];
        });

    references.push({
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

function processColumn(
  columnInfo: Pick<QueryColumnMetaData, 'alias'> &
    ProcessedQueryResultColumnSource &
    Partial<QueryColumnMetaData>,
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
    initialInputValue: getInitialInputValue(
      column,
      undefined,
      abstractType.cellInfo,
    ),
    allowedFiltersMap: getFiltersForAbstractType(abstractType.identifier),
    preprocFunctions: getPreprocFunctionsForAbstractType(
      abstractType.identifier,
    ),
    source,
    formatCellValue: getDisplayFormatter(column),
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
        initialColumn.id,
      );
      updatedColumnsMetaData = updatedColumnsMetaData.with(
        initialColumn.alias,
        processColumn(
          {
            alias: initialColumn.alias,
            type: inputColumnInformation?.type,
            is_initial_column: true,
            input_column_name: inputColumnInformation?.name,
            input_table_name: inputColumnInformation?.tableName,
            input_table_id: inputColumnInformation?.tableId,
          },
          abstractTypeMap,
        ),
      );
    });
  }
  if (summarizationTransformsWithoutMetaData.length > 0) {
    summarizationTransformsWithoutMetaData.forEach((transform) => {
      [...transform.groups.values()].forEach((group) => {
        if (!updatedColumnsMetaData.has(group.outputAlias)) {
          const inputColumn = updatedColumnsMetaData.get(
            group.inputAlias,
          )?.column;
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            group.outputAlias,
            processColumn(
              {
                alias: group.outputAlias,
                display_name: null,
                type: inputColumn?.type ?? 'unknown',
                type_options: inputColumn?.type_options ?? null,
                display_options: inputColumn?.display_options ?? null,
                is_initial_column: false,
                input_alias: group.inputAlias,
              },
              abstractTypeMap,
            ),
          );
        }
      });
      [...transform.aggregations.values()].forEach((aggregation) => {
        if (!updatedColumnsMetaData.has(aggregation.outputAlias)) {
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            aggregation.outputAlias,
            processColumn(
              {
                alias: aggregation.outputAlias,
                type:
                  aggregation.function === 'distinct_aggregate_to_array'
                    ? '_array'
                    : 'integer',
                type_options:
                  aggregation.function === 'distinct_aggregate_to_array'
                    ? {
                        type:
                          updatedColumnsMetaData.get(aggregation.inputAlias)
                            ?.column.type ?? 'unknown',
                      }
                    : null,
                display_options: null,
                is_initial_column: false,
                input_alias: aggregation.inputAlias,
              },
              abstractTypeMap,
            ),
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
  outputColumnAliases: QueryRunResponse['output_columns'],
  processedColumnMetaData: ProcessedQueryResultColumnMap,
): ProcessedQueryOutputColumnMap {
  return new ImmutableMap(
    outputColumnAliases.map((alias, index) => [
      alias,
      {
        ...(processedColumnMetaData.get(alias) ??
          processColumn({ alias, is_initial_column: true }, new Map())),
        columnIndex: index,
      },
    ]),
  );
}
