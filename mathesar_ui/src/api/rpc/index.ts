import Cookies from 'js-cookie';

import { buildRpcApi } from '@mathesar/packages/json-rpc-client-builder';

import { collaborators } from './collaborators';
import { columns } from './columns';
import { constraints } from './constraints';
import { data_modeling } from './data_modeling';
import { databases } from './databases';
import { records } from './records';
import { roles } from './roles';
import { schemas } from './schemas';
import { servers } from './servers';
import { tables } from './tables';

/** Mathesar's JSON-RPC API */
export const api = buildRpcApi({
  endpoint: '/api/rpc/v0/',
  getHeaders: () => ({ 'X-CSRFToken': Cookies.get('csrftoken') }),
  methodTree: {
    collaborators,
    columns,
    constraints,
    data_modeling,
    databases,
    records,
    roles,
    schemas,
    servers,
    tables,
  },
});
