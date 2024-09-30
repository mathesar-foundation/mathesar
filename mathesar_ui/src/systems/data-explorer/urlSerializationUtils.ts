import type { Column } from '@mathesar/api/rpc/columns';
import type {
  MaybeSavedExploration,
  QueryInstanceSummarizationTransformation,
} from '@mathesar/api/rpc/explorations';
import type { Table } from '@mathesar/models/Table';
import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
import type { TerseGrouping } from '@mathesar/stores/table-data';
import Url64 from '@mathesar/utils/Url64';

type TerseSummarizedColumn = Pick<Column, 'id' | 'name'>;
type BaseTable = Pick<Table, 'oid' | 'name'>;

interface TerseSummarization {
  databaseId: number;
  schemaOid: number;
  baseTable: BaseTable;
  columns: TerseSummarizedColumn[];
  terseGrouping: TerseGrouping;
}

/**
 * These streamline methods exist so that we don't end up serializing big
 * objects like `TableEntry` which would pass the type-check but have lots of
 * fields that are not needed at runtime.
 */
class Streamline {
  static baseTable(t: BaseTable): BaseTable {
    return {
      oid: t.oid,
      name: t.name,
    };
  }

  static terseSummarizedColumn(
    t: TerseSummarizedColumn,
  ): TerseSummarizedColumn {
    return {
      id: t.id,
      name: t.name,
    };
  }

  static terseSummarization(t: TerseSummarization): TerseSummarization {
    return {
      databaseId: t.databaseId,
      schemaOid: t.schemaOid,
      baseTable: Streamline.baseTable(t.baseTable),
      columns: t.columns.map((c) => Streamline.terseSummarizedColumn(c)),
      terseGrouping: t.terseGrouping,
    };
  }
}

function buildTableInformationHash(t: TerseSummarization): string {
  return Url64.encode(JSON.stringify(Streamline.terseSummarization(t)));
}

export function createDataExplorerUrlToExploreATable(
  databaseId: number,
  schemaId: number,
  baseTable: BaseTable,
) {
  const dataExplorerRouteUrl = getDataExplorerPageUrl(databaseId, schemaId);
  const tableInformationHash = buildTableInformationHash({
    databaseId,
    schemaOid: schemaId,
    baseTable,
    columns: [],
    terseGrouping: [],
  });
  return `${dataExplorerRouteUrl}#${tableInformationHash}`;
}

export function constructDataExplorerUrlToSummarizeFromGroup(
  databaseId: number,
  schemaId: number,
  terseSummarization: TerseSummarization,
): string | undefined {
  const dataExplorerRouteUrl = getDataExplorerPageUrl(databaseId, schemaId);
  const { columns, terseGrouping } = terseSummarization;

  if (terseGrouping.length > 0 && columns.length > 0) {
    /**
     * Using hash url here because we do not want the server involved.
     * This method is currently only used to transfer temporary grouping
     * data to the data explorer route.
     */
    const groupInformationHash = buildTableInformationHash(terseSummarization);
    return `${dataExplorerRouteUrl}#${groupInformationHash}`;
  }
  return undefined;
}

export function constructQueryModelFromHash(
  hash: string,
): MaybeSavedExploration | undefined {
  const terseSummarization = JSON.parse(
    Url64.decode(hash),
  ) as Partial<TerseSummarization>;

  if (!terseSummarization.databaseId) {
    return undefined;
  }
  if (!terseSummarization.baseTable) {
    return undefined;
  }
  if (!terseSummarization.schemaOid) {
    return undefined;
  }

  const { baseTable, databaseId, schemaOid } = terseSummarization;
  let initialColumns: MaybeSavedExploration['initial_columns'] = [];
  let transformations: MaybeSavedExploration['transformations'] = [];

  if (
    !terseSummarization.terseGrouping?.length ||
    !terseSummarization.columns
  ) {
    return {
      database_id: databaseId,
      schema_oid: schemaOid,
      base_table_oid: baseTable.oid,
    };
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
    return {
      database_id: databaseId,
      schema_oid: schemaOid,
      base_table_oid: baseTable.oid,
    };
  }

  const baseGroupingColumn = groupingColumns[0];
  const preprocFunction = groupingEntries[0][1];

  const firstNonGroupColumn = terseSummarization.columns.find(
    (entry) => !groupingColumns.includes(entry),
  );
  const aggregatedColumns = firstNonGroupColumn ? [firstNonGroupColumn] : [];

  initialColumns = [...groupingColumns, ...aggregatedColumns].map((column) => ({
    alias: column.name,
    attnum: column.id,
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
    database_id: databaseId,
    schema_oid: schemaOid,
    base_table_oid: baseTable.oid,
    initial_columns: initialColumns,
    transformations,
    display_names: displayNames,
  };
}
