import type { SchemaEntry, SchemaResponse } from '@mathesar/AppTypes';

import type { Connection } from './connections';
import {
  type PaginatedResponse,
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
} from './utils/requestUtils';

function list(connectionId: Connection['id']) {
  return getAPI<PaginatedResponse<SchemaResponse>>(
    `/api/db/v0/schemas/?connection_id=${connectionId}&limit=500`,
  );
}

function get(schemaId: SchemaEntry['id']) {
  return getAPI<SchemaResponse>(`/api/db/v0/schemas/${schemaId}/`);
}

function add(props: {
  name: SchemaEntry['name'];
  description: SchemaEntry['description'];
  connectionId: Connection['id'];
}) {
  return postAPI<SchemaResponse>('/api/db/v0/schemas/', {
    name: props.name,
    description: props.description,
    connection_id: props.connectionId,
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
