import type { Share, UnsavedShare, ShareApi } from './shares';
import {
  getAPI,
  patchAPI,
  postAPI,
  type PaginatedResponse,
} from './utils/requestUtils';

type UnsavedQueryShare = UnsavedShare;
type QueryShare = Share;

function list(queryId: number) {
  return getAPI<PaginatedResponse<QueryShare>>(
    `/api/ui/v0/queries/${queryId}/shares/`,
  );
}

function add(queryId: number, share?: UnsavedQueryShare) {
  return postAPI<QueryShare>(`/api/ui/v0/queries/${queryId}/shares/`, share);
}

function update(
  queryId: number,
  shareId: QueryShare['id'],
  properties: Partial<UnsavedQueryShare>,
) {
  return patchAPI<QueryShare>(
    `/api/ui/v0/queries/${queryId}/shares/${shareId}/`,
    properties,
  );
}

function regenerate(queryId: number, shareId: QueryShare['id']) {
  return postAPI<QueryShare>(
    `/api/ui/v0/queries/${queryId}/shares/${shareId}/regenerate/`,
  );
}

const queryShare: ShareApi<QueryShare, UnsavedQueryShare> = {
  list,
  add,
  update,
  regenerate,
};

export default queryShare;
