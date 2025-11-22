export interface SummarizedRecordReference {
  summary: string;
  key: string | number | boolean | null;
}

export interface RecordsSummaryListResponse {
  count: number;
  results: SummarizedRecordReference[];
}
