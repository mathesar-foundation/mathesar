import { derived, writable, type Readable, type Writable } from 'svelte/store';

import { ImmutableMap } from '@mathesar-component-library';
import {
  mergeRecordSummariesForSheet,
  type RecordSummariesForSheet,
} from './recordSummaryUtils';

/**
 * Stores the record summaries needed for one sheet.
 *
 * - Writing to this store is done via the imperative methods. You can either
 *   write a whole set of record summary data, as fetched from the records API;
 *   or you can add one "bespoke" record summary, as acquired from the Record
 *   Selector. The bespoke summaries don't get wiped out when the records are
 *   re-fetched from the API.
 *
 * - Reading from this store is done via its Readable interface. In reading the
 *   record summaries, you'll get both the fetched summaries and the bespoke
 *   summaries merged together. Because the bespoke summaries are never cleared,
 *   summary data is taken from the fetched summaries with higher precedence.
 */
export default class RecordSummaryStore
  implements Readable<RecordSummariesForSheet>
{
  /** Record summary data we got from the API when fetching the records */
  private fetched: Writable<RecordSummariesForSheet> = writable(
    new ImmutableMap(),
  );

  /**
   * This field stores record summary data we got piecemeal from the Record
   * Selector, each time the user submitted a selection. We need to maintain
   * this data separately from the fetched summaries so that we can re-fetch the
   * summaries while retaining the bespoke entries.
   *
   * Example:
   *
   * 1. User is using the record selector to select a record in a table with an
   *    FK column.
   * 1. They enter a value into a LinkedRecordInput search field within the
   *    record selector. At that point, we store a bespoke summary for the value
   *    they entered into that input.
   * 1. Then, then enter a search term into a text field. At that point, we
   *    re-fetch the records, wiping out the fetched summaries and replacing all
   *    of them. The bespoke summary is retained.
   *
   * There is a potential for a memory leak here because we never clear the
   * bespoke summaries -- we only add to them. This should only be growing by a
   * few dozen bytes each time the user submits the records selector, and it
   * will get destroyed on navigation, so hopefully it won't be a problem. It's
   * somewhat difficult to determine when a bespoke summary is no longer needed,
   * but we can explore ways of clearing them out if memory usage becomes a
   * problem.
   */
  private bespoke: Writable<RecordSummariesForSheet> = writable(
    new ImmutableMap(),
  );

  private combined: Readable<RecordSummariesForSheet>;

  constructor() {
    this.combined = derived([this.bespoke, this.fetched], ([a, b]) =>
      mergeRecordSummariesForSheet(a, b),
    );
  }

  subscribe(
    run: (value: RecordSummariesForSheet) => void,
    invalidate?: (value?: RecordSummariesForSheet) => void,
  ): () => void {
    return this.combined.subscribe(run, invalidate);
  }

  setFetchedSummaries(summaries: RecordSummariesForSheet): void {
    this.fetched.set(summaries);
  }

  addBespokeRecordSummary({
    columnId,
    recordId,
    recordSummary,
  }: {
    columnId: string;
    recordId: string;
    recordSummary: string;
  }): void {
    const additional: RecordSummariesForSheet = new ImmutableMap([
      [columnId, new ImmutableMap([[recordId, recordSummary]])],
    ]);
    this.bespoke.update((existing) =>
      mergeRecordSummariesForSheet(existing, additional),
    );
  }
}
