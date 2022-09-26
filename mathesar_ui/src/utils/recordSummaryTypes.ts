import type { RecordSummaryInputData } from '@mathesar/api/tables/records';

export interface DataForRecordSummaryInFkCell {
  column: number;
  template: string;
  data: RecordSummaryInputData;
}
