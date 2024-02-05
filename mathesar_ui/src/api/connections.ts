import {
  addQueryParamsToUrl,
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  type PaginatedResponse,
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

export interface CreateFromKnownConnectionProps extends CommonCreationProps {
  credentials: { connection: ConnectionReference };
  create_database: boolean;
}

/**
 * The `create_database` field is not present on this variant because we do not
 * support creating the database in this case. The reason for this restriction
 * is that we need a valid connection to an existing database in order to first
 * create one. In theory, we could ask the user to supply such a connection but
 * Sean and Brent deemed that approach to add too much additional complexity to
 * the UI to justify its inclusion. We predict that if someone already has a
 * PostgreSQL user, they are likely to already have a PostgreSQL database too.
 */
export interface CreateFromScratchProps extends CommonCreationProps {
  credentials: {
    user: string;
    password: string;
    host: string;
    port: string;
  };
}

export interface CreateWithNewUserProps extends CommonCreationProps {
  credentials: {
    create_user_via: ConnectionReference;
    user: string;
    password: string;
  };
  create_database: boolean;
}

function createFromKnownConnection(props: CreateFromKnownConnectionProps) {
  const url = '/api/ui/v0/connections/create_from_known_connection/';
  return postAPI<Connection>(url, props);
}

function createFromScratch(props: CreateFromScratchProps) {
  const url = '/api/ui/v0/connections/create_from_scratch/';
  return postAPI<Connection>(url, props);
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
  createFromKnownConnection,
  createFromScratch,
  createWithNewUser,
  update,
  delete: deleteConnection,
};
