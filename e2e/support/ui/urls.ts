import type { Database, Schema, Table } from '../api/mathesar';

export function databaseUrl(database: Database): string {
  return `/db/${database.id}/schemas/`;
}

export function schemaUrl(schema: Schema): string {
  return `/db/${schema.database.id}/schemas/${schema.oid}/`;
}

export function tableUrl(table: Table): string {
  return `${schemaUrl(table.schema)}tables/${table.oid}/`;
}

export function recordUrl(table: Table, primaryKey: string | number): string {
  return `${tableUrl(table)}${primaryKey}`;
}
