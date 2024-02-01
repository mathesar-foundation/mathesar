export function getDatabasePageUrl(connectionId: number): string {
  return `/db/${connectionId}/`;
}

export function getSchemaPageUrl(
  connectionId: number,
  schemaId: number,
): string {
  return `${getDatabasePageUrl(connectionId)}${schemaId}/`;
}

export function getSchemaPageTablesSectionUrl(
  connectionId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(connectionId, schemaId)}tables/`;
}

export function getSchemaPageExplorationsSectionUrl(
  connectionId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(connectionId, schemaId)}explorations/`;
}

export function getImportPageUrl(
  connectionId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(connectionId, schemaId)}import/`;
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
  connectionId: number,
  schemaId: number,
  previewTableId: number,
  options: ImportPreviewPageQueryParams,
): string {
  const importPageUrl = getImportPageUrl(connectionId, schemaId);
  const q = serializeImportPreviewPageQueryParams(options);
  return `${importPageUrl}${previewTableId}/?${q}`;
}

export function getDataExplorerPageUrl(
  connectionId: number,
  schemaId: number,
): string {
  return `${getSchemaPageUrl(connectionId, schemaId)}data-explorer/`;
}

export function getExplorationPageUrl(
  connectionId: number,
  schemaId: number,
  queryId: number,
): string {
  return `${getSchemaPageExplorationsSectionUrl(
    connectionId,
    schemaId,
  )}${queryId}/`;
}

export function getExplorationEditorPageUrl(
  connectionId: number,
  schemaId: number,
  queryId: number,
): string {
  return `${getExplorationPageUrl(connectionId, schemaId, queryId)}edit/`;
}

export function getTablePageUrl(
  connectionId: number,
  schemaId: number,
  tableId: number,
): string {
  return `${getSchemaPageTablesSectionUrl(connectionId, schemaId)}${tableId}/`;
}

export function getRecordPageUrl(
  connectionId: number,
  schemaId: number,
  tableId: number,
  recordId: unknown,
): string {
  return `${getTablePageUrl(connectionId, schemaId, tableId)}${String(
    recordId,
  )}`;
}

export const USER_PROFILE_URL = '/profile/';
export const ADMIN_URL = '/administration/';
export const ADMIN_UPDATE_PAGE_URL = `${ADMIN_URL}update/`;
export const ADMIN_USERS_PAGE_URL = `${ADMIN_URL}users/`;
export const ADMIN_USERS_PAGE_ADD_NEW_URL = `${ADMIN_URL}users/new/`;
export const LOGOUT_URL = '/auth/logout/';
export const CONNECTIONS_URL = '/connections/';
export const WELCOME_URL = '/welcome';

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
