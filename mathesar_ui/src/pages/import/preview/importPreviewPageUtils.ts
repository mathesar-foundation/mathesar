import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
import type { Column } from '@mathesar/api/rpc/columns';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { createTableFromDataFile, deleteTable } from '@mathesar/stores/tables';

/**
 * This is to improve loading experience by seeding the table with empty
 * records.
 */
export function getSkeletonRecords(): Record<string, unknown>[] {
  return [{}, {}];
}

export interface ProcessedPreviewColumn {
  id: number;
  column: Column;
  abstractType: AbstractType;
  cellComponentAndProps: ReturnType<typeof getCellCap>;
}

export function processColumns(
  columns: Column[],
  abstractTypeMap: AbstractTypesMap,
): ProcessedPreviewColumn[] {
  return columns.map((column) => {
    const abstractType = getAbstractTypeForDbType(column.type, abstractTypeMap);
    return {
      id: column.id,
      column,
      abstractType,
      cellComponentAndProps: getCellCap({
        cellInfo: abstractType.cellInfo,
        column,
      }),
    };
  });
}

export function makeHeaderUpdateRequest({
  schema,
  table,
  dataFile,
}: {
  schema: Schema;
  table: Pick<Table, 'oid'>;
  dataFile: Pick<DataFile, 'id'>;
}) {
  async function updateHeader({
    firstRowIsHeader,
    customizedTableName,
  }: {
    firstRowIsHeader: boolean;
    customizedTableName: string;
  }) {
    await Promise.all([
      deleteTable(schema, table.oid),
      dataFilesApi.update(dataFile.id, {
        header: firstRowIsHeader,
      }),
    ]);
    return createTableFromDataFile({
      schema,
      dataFile,
      name: customizedTableName,
    });
  }
  return new AsyncStore(updateHeader);
}

export interface ColumnProperties {
  selected: boolean;
  displayName: string;
}

function makeColumnProperties(column: Column): ColumnProperties {
  return { selected: true, displayName: column.name };
}

type ColumnPropertiesMap = Record<Column['id'], ColumnProperties>;

export function buildColumnPropertiesMap(
  columns: Column[],
): Record<Column['id'], ColumnProperties> {
  return Object.fromEntries(
    columns.map((c) => [c.id, makeColumnProperties(c)]),
  );
}

export function finalizeColumns(
  columns: Column[],
  columnPropertiesMap: ColumnPropertiesMap,
) {
  return columns
    .filter((column) => columnPropertiesMap[column.id]?.selected)
    .map((column) => ({
      id: column.id,
      name: columnPropertiesMap[column.id]?.displayName ?? '',
      type: column.type,
      type_options: column.type_options,
      display_options: column.display_options,
    }));
}
