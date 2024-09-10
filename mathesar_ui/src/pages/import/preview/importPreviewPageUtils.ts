import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
import type { Column } from '@mathesar/api/rpc/columns';
import type { Schema } from '@mathesar/api/rpc/schemas';
import type { Table } from '@mathesar/api/rpc/tables';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import type { Database } from '@mathesar/models/Database';
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

export function makeHeaderUpdateRequest() {
  interface Props {
    database: Pick<Database, 'id'>;
    schema: Pick<Schema, 'oid'>;
    table: Pick<Table, 'oid'>;
    dataFile: Pick<DataFile, 'id'>;
    firstRowIsHeader: boolean;
    customizedTableName: string;
  }
  async function updateHeader(p: Props) {
    await Promise.all([
      deleteTable(p.database, p.schema, p.table.oid),
      dataFilesApi.update(p.dataFile.id, { header: p.firstRowIsHeader }),
    ]);
    return createTableFromDataFile(p);
  }
  return new AsyncStore(updateHeader);
}

export function makeDeleteTableRequest() {
  interface Props {
    database: Database;
    schema: Schema;
    table: Pick<Table, 'oid'>;
  }
  return new AsyncStore((props: Props) =>
    deleteTable(props.database, props.schema, props.table.oid),
  );
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
