export function getDatabasePageUrl(databaseId: number): string {
  return `/db/${databaseId}/`;
}

export function getDatabasePageSchemasSectionUrl(databaseId: number): string {
  return `/db/${databaseId}/schemas/`;
}

export function getDatabasePageSettingsSectionUrl(databaseId: number): string {
  return `/db/${databaseId}/settings/`;
}

export function getDatabaseRoleConfigurationUrl(databaseId: number): string {
  return `${getDatabasePageSettingsSectionUrl(databaseId)}role-configuration/`;
}

export function getDatabaseCollaboratorsUrl(databaseId: number): string {
  return `${getDatabasePageSettingsSectionUrl(databaseId)}collaborators/`;
}

export function getDatabaseRolesUrl(databaseId: number): string {
  return `${getDatabasePageSettingsSectionUrl(databaseId)}roles/`;
}

export function getSchemaPageUrl(databaseId: number, schemaId: number): string {
  return `${getDatabasePageSchemasSectionUrl(databaseId)}${schemaId}/`;
}

export function getSchemaPageTablesSectionUrl(
  databaseId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseId, schemaId)}tables/`;
}

export function getSchemaPageExplorationsSectionUrl(
  databaseId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseId, schemaId)}explorations/`;
}

export function getImportPageUrl(databaseId: number, schemaId: number): string {
  return `${getSchemaPageUrl(databaseId, schemaId)}import/`;
}

interface ImportPreviewPageQueryParams {
  useColumnTypeInference: boolean;
}

const TYPE_INFERENCE_QUERY_PARAM = 'inference';

function serializeImportPreviewPageQueryParams(
  p: ImportPreviewPageQueryParams,
): string {
  return new URLSearchParams({
    [TYPE_INFERENCE_QUERY_PARAM]: JSON.stringify(p.useColumnTypeInference),
  }).toString();
}

export function getImportPreviewPageQueryParams(
  queryParams: Record<string, unknown>,
): ImportPreviewPageQueryParams {
  return {
    useColumnTypeInference: queryParams[TYPE_INFERENCE_QUERY_PARAM] === 'true',
  };
}

export function getImportPreviewPageUrl(
  databaseId: number,
  schemaId: number,
  previewTableId: number,
  options: ImportPreviewPageQueryParams,
): string {
  const importPageUrl = getImportPageUrl(databaseId, schemaId);
  const q = serializeImportPreviewPageQueryParams(options);
  return `${importPageUrl}${previewTableId}/?${q}`;
}

export function getDataExplorerPageUrl(
  databaseId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(databaseId, schemaId)}data-explorer/`;
}

export function getExplorationPageUrl(
  databaseId: number,
  schemaId: number,
  queryId: number,
): string {
  return `${getSchemaPageExplorationsSectionUrl(
    databaseId,
    schemaId,
  )}${queryId}/`;
}

export function getExplorationEditorPageUrl(
  databaseId: number,
  schemaId: number,
  queryId: number,
): string {
  return `${getExplorationPageUrl(databaseId, schemaId, queryId)}edit/`;
}

export function getTablePageUrl(
  databaseId: number,
  schemaId: number,
  tableId: number,
): string {
  return `${getSchemaPageTablesSectionUrl(databaseId, schemaId)}${tableId}/`;
}

export function getRecordPageUrl(
  databaseId: number,
  schemaId: number,
  tableId: number,
  recordId: unknown,
): string {
  return `${getTablePageUrl(databaseId, schemaId, tableId)}${String(recordId)}`;
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

export function getSharedTablePageUrl(slug: string): string {
  return `/shares/tables/${slug}/`;
}

export function getSharedExplorationPageUrl(slug: string): string {
  return `/shares/explorations/${slug}/`;
}

export function getDocsLink(path: string): string {
  return `https://docs.mathesar.org${path}`;
}

export function getWikiLink(path: string): string {
  return `https://wiki.mathesar.org${path}`;
}
