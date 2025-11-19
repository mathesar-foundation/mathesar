export interface SummarizedRecordReference {
  summary: string;
  key: string | number | boolean | null;
}

export interface RecordsSummaryListResponse {
  count: number;
  results: SummarizedRecordReference[];
  mapping?: {
    join_table: number;
    joined_values: {
      [key: string]: string | number | boolean | null;
    };
  };
}
