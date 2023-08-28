import type { Share, UnsavedShare, ShareApi } from './shares';
import {
  getAPI,
  patchAPI,
  postAPI,
  type PaginatedResponse,
} from './utils/requestUtils';

type UnsavedTableShare = UnsavedShare;
type TableShare = Share;

function list(tableId: number) {
  return getAPI<PaginatedResponse<TableShare>>(
    `/api/ui/v0/tables/${tableId}/shares/`,
  );
}

function add(tableId: number, share?: UnsavedTableShare) {
  return postAPI<TableShare>(`/api/ui/v0/tables/${tableId}/shares/`, share);
}

function update(
  tableId: number,
  shareId: TableShare['id'],
  properties: Partial<UnsavedTableShare>,
) {
  return patchAPI<TableShare>(
    `/api/ui/v0/tables/${tableId}/shares/${shareId}/`,
    properties,
  );
}

function regenerate(tableId: number, shareId: TableShare['id']) {
  return postAPI<TableShare>(
    `/api/ui/v0/tables/${tableId}/shares/${shareId}/regenerate/`,
  );
}

const tableShare: ShareApi<TableShare, UnsavedShare> = {
  list,
  add,
  update,
  regenerate,
};

export default tableShare;
