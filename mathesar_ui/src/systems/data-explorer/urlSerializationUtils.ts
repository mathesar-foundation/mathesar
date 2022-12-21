import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
import type { TableEntry } from '@mathesar/api/types/tables';
import type { Column } from '@mathesar/api/types/tables/columns';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
import type { TerseGrouping } from '@mathesar/stores/table-data';
import Url64 from '@mathesar/utils/Url64';
import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/types/queries';

type TerseSummarizedColumn = Pick<Column, 'id' | 'name'>;

export interface TerseSummarization {
  baseTable: Pick<TableEntry, 'id' | 'name'>;
  columns: TerseSummarizedColumn[];
  terseGrouping: TerseGrouping;
}

export function createDataExplorerUrlToExploreATable(
  databaseName: string,
  schemaId: number,
  tableId: number,
) {
  const dataExplorerRouteUrl = getDataExplorerPageUrl(databaseName, schemaId);
  const tableInformationHash = Url64.encode(
    JSON.stringify({ baseTableId: tableId }),
  );
  return `${dataExplorerRouteUrl}#${tableInformationHash}`;
}

export function constructDataExplorerUrlToSummarizeFromGroup(
  databaseName: string,
  schemaId: number,
  terseSummarization: TerseSummarization,
): string | undefined {
  const dataExplorerRouteUrl = getDataExplorerPageUrl(databaseName, schemaId);
  const { columns, terseGrouping } = terseSummarization;

  if (terseGrouping.length > 0 && columns.length > 0) {
    /**
     * Using hash url here because we do not want the server involved.
     * This method is currently only used to transfer temporary grouping
     * data to the data explorer route.
     */
    const groupInformationHash = Url64.encode(
      JSON.stringify(terseSummarization),
    );
    return `${dataExplorerRouteUrl}#${groupInformationHash}`;
  }
  return undefined;
}

export function constructQueryModelFromHash(
  hash: string,
): UnsavedQueryInstance | undefined {
  const terseSummarization = JSON.parse(
    Url64.decode(hash),
  ) as Partial<TerseSummarization>;

  if (!terseSummarization.baseTable) {
    return undefined;
  }

  const { baseTable } = terseSummarization;
  let initialColumns: UnsavedQueryInstance['initial_columns'] = [];
  let transformations: UnsavedQueryInstance['transformations'] = [];

  if (
    !terseSummarization.terseGrouping?.length ||
    !terseSummarization.columns
  ) {
    return undefined;
  }

  const columnMap = new Map(
    terseSummarization.columns.map((entry) => [entry.id, entry]),
  );
  const groupingEntries = terseSummarization.terseGrouping.filter((group) =>
    columnMap.has(group[0]),
  );
  const groupingColumns = groupingEntries
    .map((entry) => columnMap.get(entry[0]))
    .filter((entry): entry is TerseSummarizedColumn => entry !== undefined);

  if (groupingColumns.length === 0) {
    return undefined;
  }

  const baseGroupingColumn = groupingColumns[0];
  const preprocFunction = groupingEntries[0][1];

  const firstNonGroupColumn = terseSummarization.columns.find(
    (entry) => !groupingColumns.includes(entry),
  );
  const aggregatedColumns = firstNonGroupColumn ? [firstNonGroupColumn] : [];

  initialColumns = [...groupingColumns, ...aggregatedColumns].map((column) => ({
    alias: column.name,
    id: column.id,
  }));

  const groupingExpressions = groupingColumns.map((entry, index) => ({
    input_alias: entry.name,
    output_alias: `${entry.name}_grouped`,
    preproc: index === 0 ? preprocFunction : undefined,
  }));

  const aggregatedExpressions: QueryInstanceSummarizationTransformation['spec']['aggregation_expressions'] =
    aggregatedColumns.map((entry) => ({
      input_alias: entry.name,
      output_alias: `${baseTable.name}_agged`,
      function: 'count',
    }));

  const summarizationTransform: QueryInstanceSummarizationTransformation = {
    type: 'summarize',
    spec: {
      base_grouping_column: baseGroupingColumn.name,
      grouping_expressions: groupingExpressions,
      aggregation_expressions: aggregatedExpressions,
    },
  };

  transformations = [summarizationTransform];

  const groupDisplayNames = groupingExpressions.reduce(
    (_names, expression) => ({
      ..._names,
      [expression.output_alias]: `${expression.input_alias} group`,
    }),
    {} as Record<string, string>,
  );
  const displayNames = aggregatedExpressions.reduce(
    (_names, expression) => ({
      ..._names,
      [expression.output_alias]: `${baseTable.name} count`,
    }),
    groupDisplayNames,
  );

  return {
    base_table: baseTable.id,
    initial_columns: initialColumns,
    transformations,
    display_names: displayNames,
  };
}
