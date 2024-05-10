import {
  type PaginatedResponse,
  addQueryParamsToUrl,
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
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

export const sampleDataOptions = [
  'library_management',
  'movie_collection',
] as const;

export type SampleDataSchemaIdentifier = (typeof sampleDataOptions)[number];

export type ConnectionReference =
  | { connection_type: 'internal_database' }
  | { connection_type: 'user_database'; id: Connection['id'] };

export interface CommonCreationProps {
  database_name: string;
  sample_data: SampleDataSchemaIdentifier[];
  nickname: string;
}

export interface CreateWithNewUserProps extends CommonCreationProps {
  credentials: {
    create_user_via: ConnectionReference;
    user: string;
    password: string;
  };
  create_database: boolean;
}

function createWithNewUser(props: CreateWithNewUserProps) {
  const url = '/api/ui/v0/connections/create_with_new_user/';
  return postAPI<Connection>(url, props);
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
  createWithNewUser,
  update,
  delete: deleteConnection,
};
