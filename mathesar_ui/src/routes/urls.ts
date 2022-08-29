export function getDatabasePageUrl(databaseName: string): string {
  return `/${databaseName}/`;
}

export function getSchemaPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/`;
}

export function getImportPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/import`;
}

export function getDataExplorerPageUrl(
  databaseName: string,
  schemaId: number,
  queryId?: number,
): string {
  if (queryId !== undefined) {
    return `/${databaseName}/${schemaId}/data-explorer/${queryId}/`;
  }
  return `/${databaseName}/${schemaId}/data-explorer/`;
}

export function getTablePageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
): string {
  return `/${databaseName}/${schemaId}/${tableId}/`;
}

export function getRecordPageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
  recordId: unknown,
): string {
  return `/${databaseName}/${schemaId}/${tableId}/${String(recordId)}`;
}
