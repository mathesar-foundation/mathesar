import type { Column } from '@mathesar/api/rpc/columns';
import type {
  QueryColumnMetaData,
  QueryGeneratedColumnSource,
  QueryInitialColumnSource,
  QueryResultColumn,
  QueryRunResponse,
} from '@mathesar/api/rpc/explorations';
import type {
  JoinPath,
  JoinableTablesResult,
  Table,
} from '@mathesar/api/rpc/tables';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
  getDisplayFormatter,
  getInitialInputValue,
} from '@mathesar/components/cell-fabric/utils';
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
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import { ImmutableMap } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

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

export function getColumnInformationMap(
  result: JoinableTablesResult,
  baseTable: Pick<Table, 'oid' | 'name'>,
): InputColumnsStoreSubstance['inputColumnInformationMap'] {
  const map: InputColumnsStoreSubstance['inputColumnInformationMap'] =
    new Map();

  // TODO_BETA: figure out how to deal with the fact that our `Table` type no
  // longer has a `columns` field.

  // baseTable.columns.forEach((column) => {
  //   map.set(column.id, {
  //     id: column.id,
  //     name: column.name,
  //     type: column.type,
  //     tableId: baseTable.oid,
  //     tableName: baseTable.name,
  //   });
  // });
  for (const [tableIdKey, table] of Object.entries(result.target_table_info)) {
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

export function getBaseTableColumnsWithLinks(
  result: JoinableTablesResult,
  baseTable: Pick<Table, 'oid' | 'name'>,
): Map<ColumnWithLink['id'], ColumnWithLink> {
  // TODO_BETA: figure out how to deal with the fact that our `Table` type no
  // longer has a `columns` field.

  // const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
  //   baseTable.columns.map((column) => [
  //     column.id,
  //     {
  //       id: column.id,
  //       name: column.name,
  //       type: column.type,
  //       tableName: baseTable.name,
  //       linksTo: getLinkFromColumn(result, column.id, 1),
  //       producesMultipleResults: false,
  //     },
  //   ]);

  const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] = [];

  return new Map(columnMapEntries.sort(compareColumnByLinks));
}

export function getTablesThatReferenceBaseTable(
  result: JoinableTablesResult,
  baseTable: Pick<Table, 'oid' | 'name'>,
): ReferencedByTable[] {
  const referenceLinks = result.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fkey_path[0][1] === true,
  );
  const references: ReferencedByTable[] = [];

  referenceLinks.forEach((reference) => {
    const tableId = reference.target;
    const table = result.target_table_info[tableId];
    const baseTableColumnId = reference.join_path[0][0];
    const referenceTableColumnId = reference.join_path[0][1][1];

    // TODO_BETA: figure out how to deal with the fact that our `Table` type no
    // longer has a `columns` field.

    // const baseTableColumn = baseTable.columns.find(
    //   (column) => column.id === baseTableColumnId,
    // );
    const baseTableColumn = undefined;

    if (!baseTableColumn) {
      return;
    }
    // const table = 0;
    const columnMapEntries: [ColumnWithLink['id'], ColumnWithLink][] =
      Object.entries(table.columns)
        .filter(([columnId]) => columnId !== String(referenceTableColumnId))
        .map(([columnIdKey, column]) => {
          const columnId = parseInt(columnIdKey, 10);
          const parentPath = reference.join_path.join(',');
          return [
            columnId,
            {
              id: columnId,
              name: column.name,
              type: column.type,
              tableName: table.name,
              linksTo: getLinkFromColumn(result, columnId, 2, parentPath),
              jpPath: reference.join_path,
              producesMultipleResults: reference.multiple_results,
            },
          ];
        });

    references.push({
      id: tableId,
      name: table.name,
      referencedViaColumn: {
        id: referenceTableColumnId,
        ...table.columns[referenceTableColumnId],
      },
      linkedToColumn: baseTableColumn,
      columns: new Map(columnMapEntries.sort(compareColumnByLinks)),
    });
  });

  return references;
}

// type T = SimplifyDeep<Pick<QueryColumnMetaData, 'alias'> &
// ProcessedQueryResultColumnSource &
// Partial<QueryColumnMetaData>>;

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
    metadata: columnInfo.metadata ?? null,
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
    summarizationFunctions: getSummarizationFunctionsForAbstractType(
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
          const inputColumn = updatedColumnsMetaData.get(group.inputAlias)
            ?.column;
          updatedColumnsMetaData = updatedColumnsMetaData.with(
            group.outputAlias,
            processColumn(
              {
                alias: group.outputAlias,
                display_name: null,
                type: inputColumn?.type ?? 'unknown',
                type_options: inputColumn?.type_options ?? null,
                metadata: inputColumn?.metadata ?? null,
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
                        // TODO_BETA: Ask Pavish.
                        //
                        // `Column['type_options']` was previously typed loosely
                        // as `Record<string, unknown> | null`. Now it's more
                        // strict and it doesn't have a `type` property.
                        //
                        // type:
                        //   updatedColumnsMetaData.get(aggregation.inputAlias)
                        //     ?.column.type ?? 'unknown',
                      }
                    : null,
                metadata: null,
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
