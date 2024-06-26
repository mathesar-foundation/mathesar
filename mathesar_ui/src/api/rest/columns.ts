import type { TableEntry } from './types/tables';
import type { Column } from './types/tables/columns';
import { type PaginatedResponse, getAPI } from './utils/requestUtils';

function list(tableId: TableEntry['id']) {
  const url = `/api/db/v0/tables/${tableId}/columns/?limit=500`;
  return getAPI<PaginatedResponse<Column>>(url);
}

export const columnsApi = {
  list,
};
