import { ImmutableMap } from '@mathesar-component-library';
import type {
  SortDirection as ApiSortDirection,
  SortingEntry as ApiSortingEntry,
  GetRequestParams,
} from '@mathesar/api/tables/records';
import type { Grouping } from './grouping';

export enum SortDirection {
  /** Ascending */
  A = 'a',
  /** Descending */
  D = 'd',
}

function sortDirectionIsValid(d: string): boolean {
  return (Object.values(SortDirection) as string[]).includes(d);
}

const apiSortDirectionMap = new Map<SortDirection, ApiSortDirection>([
  [SortDirection.A, 'asc'],
  [SortDirection.D, 'desc'],
]);
function getApiSortDirection(sortDirection: SortDirection): ApiSortDirection {
  const d = apiSortDirectionMap.get(sortDirection);
  if (!d) {
    throw new Error(`Invalid sort direction: ${sortDirection}`);
  }
  return d;
}

const directionLabels = new Map([
  [SortDirection.A, 'asc'],
  [SortDirection.D, 'desc'],
]);
export function getDirectionLabel(
  direction: SortDirection | undefined,
): string {
  return direction ? directionLabels.get(direction) ?? '' : '';
}

/**
 * [columnId, sortDirection]
 */
export type TerseSorting = [number, SortDirection][];

export class Sorting extends ImmutableMap<number, SortDirection> {
  constructor(entries: Iterable<[number, SortDirection]> = []) {
    [...entries].forEach(([, sortDirection]) => {
      // Even though TS will catch build-time errors with SortDirection, we also
      // want runtime validation because new sorting entries are created from
      // input such as localStorage and URL params.
      if (!sortDirectionIsValid(sortDirection)) {
        throw new Error(`Invalid sort direction: ${sortDirection}`);
      }
    });
    super(entries);
  }

  private recordsRequestParams(): Pick<GetRequestParams, 'order_by'> {
    const sortingEntries: ApiSortingEntry[] = [...this].map(
      ([columnId, sortDirection]) => ({
        field: columnId,
        direction: getApiSortDirection(sortDirection),
      }),
    );
    if (!sortingEntries.length) {
      return {};
    }
    return { order_by: sortingEntries };
  }

  /**
   * When grouping records, the API does not automatically sort the records by
   * their groups. We need to manually tell the API that we want the records
   * sorted by the groups too.
   */
  recordsRequestParamsIncludingGrouping(
    grouping: Grouping,
  ): Pick<GetRequestParams, 'order_by'> {
    const sortingFromGrouping = new Sorting(
      [...grouping].map((g) => [g, SortDirection.A]),
    );
    return sortingFromGrouping.coalesceEntries(this).recordsRequestParams();
  }

  terse(): TerseSorting {
    return [...this].map(([columnId, sortDirection]) => [
      columnId,
      sortDirection,
    ]);
  }

  static fromTerse(t: TerseSorting): Sorting {
    return new Sorting(
      t.map(([columnId, sortDirection]) => [columnId, sortDirection]),
    );
  }
}
