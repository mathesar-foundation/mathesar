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
  return `/${databaseName}/${schemaId}/import/`;
}

export function getImportPreviewPageUrl(
  databaseName: string,
  schemaId: number,
  previewTableId: number,
): string {
  return `/${databaseName}/${schemaId}/import/${previewTableId}/`;
}

export function getDataExplorerPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/data-explorer/`;
}

export function getExplorationPageUrl(
  databaseName: string,
  schemaId: number,
  queryId: number,
): string {
  return `/${databaseName}/${schemaId}/explorations/${queryId}/`;
}

export function getTablePageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
): string {
  return `/${databaseName}/${schemaId}/tables/${tableId}/`;
}

export function getRecordPageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
  recordId: unknown,
): string {
  return `/${databaseName}/${schemaId}/tables/${tableId}/${String(recordId)}`;
}
