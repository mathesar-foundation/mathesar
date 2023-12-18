import {
  getAPI,
  patchAPI,
  type PaginatedResponse,
  deleteAPI,
  addQueryParamsToUrl,
} from './utils/requestUtils';

export interface Connection {
  id: number;
  nickname: string;
  database: string;
  username: string;
  host: string;
  port: number;
}

interface ConnectionWithPassword extends Connection {
  password: string;
}

export type UpdatableConnectionProperties = Omit<ConnectionWithPassword, 'id'>;

function list() {
  return getAPI<PaginatedResponse<Connection>>(
    '/api/db/v0/connections/?limit=500',
  );
}

function update(
  connectionId: Connection['id'],
  properties: Partial<UpdatableConnectionProperties>,
) {
  return patchAPI<Connection>(
    `/api/db/v0/connections/${connectionId}/`,
    properties,
  );
}

function deleteConnection(
  connectionId: Connection['id'],
  deleteMathesarSchemas = false,
) {
  const params = { del_msar_schemas: deleteMathesarSchemas };
  const url = addQueryParamsToUrl(
    `/api/db/v0/connections/${connectionId}/`,
    params,
  );
  return deleteAPI(url);
}

export default {
  list,
  update,
  delete: deleteConnection,
};
