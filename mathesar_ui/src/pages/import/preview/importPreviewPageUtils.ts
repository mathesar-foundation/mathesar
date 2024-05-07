import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
import type {
  MinimalColumnDetails,
  TableEntry,
} from '@mathesar/api/rest/types/tables';
import type { Column } from '@mathesar/api/rest/types/tables/columns';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { createTable, deleteTable } from '@mathesar/stores/tables';

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
    database: Database;
    schema: SchemaEntry;
    table: Pick<TableEntry, 'id'>;
    dataFile: Pick<DataFile, 'id'>;
    firstRowIsHeader: boolean;
    customizedTableName: string;
  }
  async function updateHeader(p: Props) {
    await Promise.all([
      deleteTable(p.database, p.schema, p.table.id),
      dataFilesApi.update(p.dataFile.id, { header: p.firstRowIsHeader }),
    ]);
    return createTable(p.database, p.schema, {
      name: p.customizedTableName,
      dataFiles: [p.dataFile.id],
    });
  }
  return new AsyncStore(updateHeader);
}

export function makeDeleteTableRequest() {
  interface Props {
    database: Database;
    schema: SchemaEntry;
    table: Pick<TableEntry, 'id'>;
  }
  return new AsyncStore((props: Props) =>
    deleteTable(props.database, props.schema, props.table.id),
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
): MinimalColumnDetails[] {
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
