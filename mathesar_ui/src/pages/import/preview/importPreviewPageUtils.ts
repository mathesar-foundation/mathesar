import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import { columnsApi } from '@mathesar/api/columns';
import { dataFilesApi } from '@mathesar/api/dataFiles';
import type { Column } from '@mathesar/api/types/tables/columns';
import { ImmutableMap } from '@mathesar-component-library';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import { createTable, deleteTable } from '@mathesar/stores/tables';
import type { MinimalColumnDetails } from '@mathesar/api/types/tables';

/**
 * This is to improve loading experience by seeding the table with empty
 * records.
 */
export function getSkeletonRecords(): Record<string, unknown>[] {
  return [{}, {}];
}

interface ProcessedPreviewColumn {
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
    tableId: number;
    dataFileId: number;
    firstRowIsHeader: boolean;
    tableName: string;
  }
  async function updateHeader(p: Props) {
    await Promise.all([
      deleteTable(p.database, p.schema, p.tableId),
      dataFilesApi.update(p.dataFileId, { header: p.firstRowIsHeader }),
    ]);
    return createTable(p.database, p.schema, {
      name: p.tableName,
      dataFiles: [p.dataFileId],
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
