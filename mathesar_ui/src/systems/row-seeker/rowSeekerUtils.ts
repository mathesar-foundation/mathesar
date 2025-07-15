import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { RecordSummaryListResult } from '@mathesar/api/rpc/records';

export interface RowSeekerRecord {
  summary: string;
  pk: string | number | boolean | null;
}

export function recordsAreEqual(
  opt1: RecordSummaryListResult | undefined,
  opt2: RecordSummaryListResult | undefined,
  primaryKeyColumn: RawColumnWithMetadata | undefined,
) {
  if (primaryKeyColumn) {
    return (
      opt1?.values[primaryKeyColumn.id] === opt2?.values[primaryKeyColumn.id]
    );
  }
  return false;
}
