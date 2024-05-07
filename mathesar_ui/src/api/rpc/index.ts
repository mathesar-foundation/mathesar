import Cookies from 'js-cookie';

import { buildRpcApi } from '@mathesar/packages/json-rpc-client-builder';

import { connections } from './connections';

/** Mathesar's JSON-RPC API */
export const api = buildRpcApi({
  endpoint: '/api/rpc/v0/',
  getHeaders: () => ({ 'X-CSRFToken': Cookies.get('csrftoken') }),
  methodTree: {
    connections,
  },
});
