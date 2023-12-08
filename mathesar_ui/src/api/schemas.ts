import type { SchemaEntry, SchemaResponse } from '@mathesar/AppTypes';
import {
  getAPI,
  patchAPI,
  type PaginatedResponse,
  deleteAPI,
  postAPI,
} from './utils/requestUtils';
import type { Connection } from './connections';

function list(databaseName: Connection['nickname']) {
  return getAPI<PaginatedResponse<SchemaResponse>>(
    `/api/db/v0/schemas/?database=${databaseName}&limit=500`,
  );
}

function get(schemaId: SchemaEntry['id']) {
  return getAPI<SchemaResponse>(`/api/db/v0/schemas/${schemaId}/`);
}

function add(props: {
  name: SchemaEntry['name'];
  description: SchemaEntry['description'];
  databaseName: Connection['nickname'];
}) {
  return postAPI<SchemaResponse>('/api/db/v0/schemas/', {
    name: props.name,
    description: props.description,
    database: props.databaseName,
  });
}

function update(schema: {
  id: SchemaEntry['id'];
  name?: SchemaEntry['name'];
  description?: SchemaEntry['description'];
}) {
  return patchAPI<SchemaResponse>(`/api/db/v0/schemas/${schema.id}/`, {
    name: schema.name,
    description: schema.description,
  });
}

function deleteSchema(schemaId: SchemaEntry['id']) {
  return deleteAPI(`/api/db/v0/schemas/${schemaId}/`);
}

export default {
  list,
  get,
  add,
  update,
  delete: deleteSchema,
};
