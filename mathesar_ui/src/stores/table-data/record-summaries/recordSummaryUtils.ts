import { map } from 'iter-tools';

import type {
  RecordSummaryColumnData,
  RecordsResponse,
} from '@mathesar/api/rpc/records';
import { ImmutableMap } from '@mathesar-component-library';

/** Keys are stringifed record ids */
export type RecordSummariesForColumn = ImmutableMap<string, string>;

function buildRecordSummariesForColumn(
  d: RecordSummaryColumnData,
): RecordSummariesForColumn {
  return new ImmutableMap(Object.entries(d));
}

/** Keys are stringified column ids */
export type RecordSummariesForSheet = ImmutableMap<
  string,
  RecordSummariesForColumn
>;

export function buildRecordSummariesForSheet(
  d: RecordsResponse['linked_record_summaries'],
): RecordSummariesForSheet {
  return new ImmutableMap(
    map(
      ([k, v]) => [k, buildRecordSummariesForColumn(v)],
      Object.entries(d ?? {}),
    ),
  );
}

function mergeRecordSummariesForColumn(
  a: RecordSummariesForColumn,
  b: RecordSummariesForColumn,
): RecordSummariesForColumn {
  return a.withEntries(b);
}

export function mergeRecordSummariesForSheet(
  a: RecordSummariesForSheet,
  b: RecordSummariesForSheet,
): RecordSummariesForSheet {
  return a.withEntries(b, mergeRecordSummariesForColumn);
}
