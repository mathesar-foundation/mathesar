import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
import type { Column, ColumnPatchSpec } from '@mathesar/api/rpc/columns';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type { AbstractType } from '@mathesar/stores/abstract-types/types';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { createTableFromDataFile, deleteTable } from '@mathesar/stores/tables';

/**
 * This is to improve loading experience by seeding the table with empty
 * records.
 */
export function getSkeletonRecords(): Record<string, unknown>[] {
  return [{}, {}];
}

export const RESERVED_ID_COLUMN_NAME = 'id';

export interface ProcessedPreviewColumn {
  id: number;
  column: Column;
  abstractType: AbstractType;
  cellComponentAndProps: ReturnType<typeof getCellCap>;
}

export function processColumns(columns: Column[]): ProcessedPreviewColumn[] {
  return columns.map((column) => {
    const abstractType = getAbstractTypeForDbType(column.type);
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

function finalizeColumn(
  { id, type, primary_key, type_options }: Column,
  name: string | undefined,
): ColumnPatchSpec {
  return {
    id,
    name,

    // For most columns we include type information so that users can modify
    // column types during import.
    //
    // But for PK columns we don't want to send these details to the backend. In
    // most cases it wouldn't matter if we sent the type details, because we
    // disable the type config form elements on the front end and it would be
    // theoretically be a no-op to send the type details that we got back from
    // the server. However in [#4372] we had a slippery bug that seemed best to
    // fix on the front end by avoiding sending type details for PK columns.
    //
    // [#4372]: https://github.com/mathesar-foundation/mathesar/issues/4372
    ...(primary_key ? {} : { type, type_options }),
  };
}

export function finalizeColumns(
  columns: Column[],
  columnPropertiesMap: ColumnPropertiesMap,
) {
  return columns
    .filter((c) => columnPropertiesMap[c.id]?.selected)
    .map((c) => finalizeColumn(c, columnPropertiesMap[c.id]?.displayName));
}
