import type {
  getAPI,
  postAPI,
  PaginatedResponse,
  patchAPI,
} from './utils/requestUtils';

export interface UnsavedShare {
  enabled: boolean;
}

export interface Share extends UnsavedShare {
  id: number;
  slug: string;
}

export interface ShareApi<
  T extends Share = Share,
  U extends UnsavedShare = UnsavedShare,
> {
  list: (entityId: number) => ReturnType<typeof getAPI<PaginatedResponse<T>>>;
  add: (entityId: number, share?: U) => ReturnType<typeof postAPI<T>>;
  update: (
    entityId: number,
    shareId: number,
    share: Partial<U>,
  ) => ReturnType<typeof patchAPI<T>>;
  regenerate: (
    entityId: number,
    shareId: number,
  ) => ReturnType<typeof postAPI<T>>;
}
