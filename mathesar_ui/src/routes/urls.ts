export function getDatabasePageUrl(databaseName: string): string {
  return `/db/${databaseName}/`;
}

export function getSchemaPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `${getDatabasePageUrl(databaseName)}${schemaId}/`;
}

export function getSchemaPageTablesSectionUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseName, schemaId)}tables/`;
}

export function getSchemaPageExplorationsSectionUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseName, schemaId)}explorations/`;
}

export function getImportPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseName, schemaId)}import/`;
}

export function getImportPreviewPageUrl(
  databaseName: string,
  schemaId: number,
  previewTableId: number,
): string {
  return `${getImportPageUrl(databaseName, schemaId)}${previewTableId}/`;
}

export function getDataExplorerPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseName, schemaId)}data-explorer/`;
}

export function getExplorationPageUrl(
  databaseName: string,
  schemaId: number,
  queryId: number,
): string {
  return `${getSchemaPageExplorationsSectionUrl(
    databaseName,
    schemaId,
  )}${queryId}/`;
}

export function getExplorationEditorPageUrl(
  databaseName: string,
  schemaId: number,
  queryId: number,
): string {
  return `${getExplorationPageUrl(databaseName, schemaId, queryId)}edit/`;
}

export function getTablePageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
): string {
  return `${getSchemaPageTablesSectionUrl(databaseName, schemaId)}${tableId}/`;
}

export function getRecordPageUrl(
  databaseName: string,
  schemaId: number,
  tableId: number,
  recordId: unknown,
): string {
  return `${getTablePageUrl(databaseName, schemaId, tableId)}${String(
    recordId,
  )}`;
}

export const USER_PROFILE_URL = '/profile/';
export const ADMIN_URL = '/administration/';
export const ADMIN_UPDATE_PAGE_URL = `${ADMIN_URL}update/`;
export const ADMIN_USERS_PAGE_URL = `${ADMIN_URL}users/`;
export const ADMIN_USERS_PAGE_ADD_NEW_URL = `${ADMIN_URL}users/new/`;
export const LOGOUT_URL = '/auth/logout/';

export function getEditUsersPageUrl(userId: number) {
  return `${ADMIN_USERS_PAGE_URL}${userId}/`;
}
