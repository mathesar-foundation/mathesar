import { filter, first, map } from 'iter-tools';
import * as Papa from 'papaparse';

import type {
  ImportColumnMapping,
  ImportColumnMappingEntry,
} from '@mathesar/api/rest/bulkInsert';
import { columnDefaultAllowsInsertion } from '@mathesar/api/rpc/columns';
import type {
  ProcessedColumn,
  ProcessedColumns,
} from '@mathesar/stores/table-data';
import { BidirectionalMap } from '@mathesar/utils/BidirectionalMap';

export interface CsvPreviewField {
  index: number;
  name?: string;
  sampleValue: string;
}

interface NamedCsvPreviewField extends CsvPreviewField {
  name: string;
}

function isNamed(f: CsvPreviewField): f is NamedCsvPreviewField {
  return f.name !== undefined;
}

export interface CsvPreviewSuccess {
  status: 'success';
  fields: CsvPreviewField[];
}

export interface ParseFailure {
  status: 'failure';
  message: string;
}

export type CsvPreviewResult = CsvPreviewSuccess | ParseFailure;

export async function parseCsvPreview(
  file: File,
  options: {
    hasHeaderRow?: boolean;
  } = {},
): Promise<CsvPreviewResult> {
  const header = options?.hasHeaderRow ?? true;

  return new Promise((resolve) => {
    let firstRow: unknown;

    Papa.parse(file, {
      header,
      step: (results, parser) => {
        firstRow = results.data;
        parser.abort(); // Stop after the first row
      },
      complete: () => {
        const fields = (() => {
          if (header) {
            const row = firstRow as Record<string, string>;
            return Object.entries(row).map(([name, sampleValue], index) => ({
              index,
              name,
              sampleValue,
            }));
          }
          const row = firstRow as string[];
          return row.map((sampleValue, index) => ({ sampleValue, index }));
        })();
        resolve({ status: 'success', fields });
      },
      error: () => {
        // TODO improve message
        resolve({ status: 'failure', message: 'Parse error' });
      },
    });
  });
}

/**
 * Each entry in the array represents one column in the CSV data, matched up by
 * index.
 *
 * When the array entry value is a ProcessedColumn, this indicates that the CSV
 * column corresponding to this array index is to be mapped to the specified
 * table column.
 *
 * When the array entry is undefined, this indicates that the CSV column
 * corresponding to this array index is to be skipped during import.
 */
export type CsvImportMapping = (ProcessedColumn | undefined)[];

function simplifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Filters out columns into which we cannot insert data. */
export function getAvailableTableColumns(
  tableColumns: ProcessedColumns,
): ProcessedColumns {
  return new Map(
    filter(
      ([, { column }]) => columnDefaultAllowsInsertion(column),
      tableColumns.entries(),
    ),
  );
}

export function guessCsvImportMapping(props: {
  csvColumns: CsvPreviewField[];
  availableTableColumns: ProcessedColumns;
}): CsvImportMapping {
  const { csvColumns } = props;
  const tableColumns = props.availableTableColumns;

  /** Maps CSV Column indexes to table column attnums */
  const connections = new BidirectionalMap<number, number>();

  function getUnmappedCsvColumns() {
    return filter((c) => !connections.hasKey(c.index), csvColumns);
  }

  function getUnmappedTableColumns() {
    return filter((c) => !connections.hasValue(c.id), tableColumns.values());
  }

  const tableColumnsByName = new Map(
    map(([, c]) => [c.column.name, c], tableColumns),
  );

  function setConnectionsBySimplifiedName() {
    const csvColumnsBySimplifiedName = new Map(
      csvColumns.filter(isNamed).map((c) => [simplifyName(c.name), c]),
    );
    if (csvColumnsBySimplifiedName.size < tableColumns.size) {
      // If we lost some columns after simplifying names, then we give up on the
      // simplified-name approach altogether. This is to err on the side of
      // clearer logic and more consistent behavior regardless of column order.
      return;
    }

    const tableColumnsBySimplifiedName = new Map(
      map(([, c]) => [simplifyName(c.column.name), c], tableColumns),
    );
    if (tableColumnsBySimplifiedName.size < tableColumns.size) {
      return;
    }

    const columnEntries = csvColumnsBySimplifiedName.entries();
    for (const [simplifiedName, csvColumn] of columnEntries) {
      const tableColumn = tableColumnsBySimplifiedName.get(simplifiedName);
      if (!tableColumn) continue;
      connections.set(csvColumn.index, tableColumn.id);
    }
  }

  function setConnectionsByName() {
    for (const csvColumn of getUnmappedCsvColumns()) {
      if (!csvColumn.name) continue;
      const tableColumn = tableColumnsByName.get(csvColumn.name);
      if (!tableColumn) continue;
      connections.set(csvColumn.index, tableColumn.id);
    }
  }

  function setRemainingConnections() {
    for (const csvColumn of getUnmappedCsvColumns()) {
      const tableColumn = first(getUnmappedTableColumns());
      // Stop if we're out of table columns
      if (!tableColumn) return;
      connections.set(csvColumn.index, tableColumn.id);
    }
  }

  function* buildMapping() {
    for (const csvColumn of csvColumns) {
      const attnum = connections.getValue(csvColumn.index);
      if (attnum === undefined) {
        yield undefined;
        continue;
      }
      const column = tableColumns.get(attnum);
      if (!column) {
        yield undefined;
        continue;
      }
      yield column;
    }
  }

  setConnectionsBySimplifiedName();
  setConnectionsByName();
  setRemainingConnections();
  return [...buildMapping()];
}

export function buildMappingForApi(
  mapping: CsvImportMapping,
  fields: CsvPreviewField[],
): ImportColumnMapping {
  function transformEntry(
    tableColumn: ProcessedColumn | undefined,
    index: number,
  ): ImportColumnMappingEntry {
    const field = fields.at(index);
    if (!field) {
      throw new Error('Field not found'); // If this happens, it's a bug
    }

    return {
      csv_column: { index, name: field.name },
      table_column: tableColumn?.id ?? null,
    };
  }

  return mapping.map(transformEntry);
}
