import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
import type { TerseGrouping } from '@mathesar/stores/table-data';
import Url64 from '@mathesar/utils/Url64';

export interface TerseSummarization {
  baseTableId: number;
  columns: {
    id: number;
    name: string;
  }[];
  terseGrouping: TerseGrouping;
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

export function constructQueryModelFromTerseSummarizationHash(
  hash: string,
): UnsavedQueryInstance {
  const terseSummarization = JSON.parse(
    Url64.decode(hash),
  ) as TerseSummarization;
  const groupedColumnId = terseSummarization.terseGrouping[0][0];
  const groupedColumn = terseSummarization.columns.find(
    (column) => column.id === groupedColumnId,
  );
  if (!groupedColumn) {
    return {};
  }
  const firstNonGroupColumn = terseSummarization.columns.find(
    (entry) => entry.id !== groupedColumnId,
  );
  const aggregatedColumns = firstNonGroupColumn ? [firstNonGroupColumn] : [];

  return {
    base_table: terseSummarization.baseTableId,
    initial_columns: terseSummarization.columns.map((column) => ({
      alias: column.name,
      id: column.id,
      display_name: column.name,
    })),
    transformations: [
      {
        type: 'summarize',
        spec: {
          grouping_expressions: [
            {
              input_alias: groupedColumn.name,
              output_alias: groupedColumn.name,
              preproc: terseSummarization.terseGrouping[0][1],
            },
          ],
          aggregation_expressions: aggregatedColumns.map((entry) => ({
            input_alias: entry.name,
            output_alias: `${entry.name} (aggregated)`,
            function: 'count',
          })),
        },
        display_names: aggregatedColumns.reduce(
          (displayNames, entry) => ({
            ...displayNames,
            [`${entry.name} (aggregated)`]: `Count(${entry.name})`,
          }),
          {} as Record<string, string>,
        ),
      },
    ],
  };
}
