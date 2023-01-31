export function getDatabasePageUrl(databaseName: string): string {
  return `/${databaseName}/`;
}

export function getSchemaPageUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/`;
}

export function getSchemaPageTablesSectionUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/tables/`;
}

export function getSchemaPageExplorationsSectionUrl(
  databaseName: string,
  schemaId: number,
): string {
  return `/${databaseName}/${schemaId}/explorations/`;
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

export function getExplorationEditorPageUrl(
  databaseName: string,
  schemaId: number,
  queryId: number,
): string {
  return `/${databaseName}/${schemaId}/explorations/edit/${queryId}/`;
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

export const USER_PROFILE_URL = '/profile/';
export const ADMIN_URL = '/administration/';
export const ADMIN_GENERAL_PAGE_URL = `${ADMIN_URL}general/`;
export const ADMIN_USERS_PAGE_URL = `${ADMIN_URL}users/`;
export const ADMIN_USERS_PAGE_ADD_NEW_URL = `${ADMIN_URL}users/new/`;
export const LOGOUT_URL = '/auth/logout/';

export function getEditUsersPageUrl(userId: number) {
  return `${ADMIN_USERS_PAGE_URL}${userId}/`;
}
