import type { GetRequestParams } from '@mathesar/api/tables/records';

const DEFAULT_PAGE_SIZE = 500;

/**
 * [page, size]
 */
export type TersePagination = [number, number];

export class Pagination {
  /** The first page is page 1 */
  readonly page: number;

  /** The number of records to display */
  readonly size: number;

  readonly offset: number;

  constructor({ page, size }: { page?: number; size?: number } = {}) {
    this.page = page ?? 1;
    this.size = size ?? DEFAULT_PAGE_SIZE;
    this.offset = (this.page - 1) * this.size;
  }

  recordsRequestParams(): Pick<GetRequestParams, 'limit' | 'offset'> {
    return {
      limit: this.size,
      offset: this.offset,
    };
  }

  terse(): TersePagination {
    return [this.page, this.size];
  }

  static fromTerse(terse: TersePagination): Pagination {
    return new Pagination({
      page: terse[0],
      size: terse[1],
    });
  }
}
