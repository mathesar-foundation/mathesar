import { derived, writable, type Readable } from 'svelte/store';

import type { TableEntry } from '@mathesar/api/tables';
import type { Response as ApiResponse } from '@mathesar/api/tables/records';
import { WritableMap } from '@mathesar/component-library';
import {
  renderTransitiveRecordSummary,
  prepareFieldsAsRecordSummaryInputData,
  buildRecordSummariesForSheet,
} from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import { getAPI, patchAPI, type RequestStatus } from '@mathesar/utils/api';
import { getErrorMessage } from '@mathesar/utils/errors';
import RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';

export default class RecordStore {
  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fields = new WritableMap<number, unknown>();

  recordSummaries = new RecordSummaryStore();

  summary: Readable<string>;

  table: TableEntry;

  recordId: number;

  private url: string;

  constructor({ table, recordId }: { table: TableEntry; recordId: number }) {
    this.table = table;
    this.recordId = recordId;
    this.url = `/api/db/v0/tables/${this.table.id}/records/${this.recordId}/`;
    const { template } = this.table.settings.preview_settings;
    this.summary = derived(
      [this.fields, this.recordSummaries],
      ([fields, fkSummaryData]) =>
        renderTransitiveRecordSummary({
          template,
          inputData: prepareFieldsAsRecordSummaryInputData(fields),
          transitiveData: fkSummaryData,
        }),
    );
    void this.fetch();
  }

  private updateSelfWithApiResponseData(response: ApiResponse): void {
    const result = response.results[0];
    this.fields.reconstruct(
      Object.entries(result).map(([k, v]) => [parseInt(k, 10), v]),
    );
    if (response.preview_data) {
      this.recordSummaries.setFetchedSummaries(
        buildRecordSummariesForSheet(response.preview_data),
      );
    }
  }

  async fetch(): Promise<void> {
    this.fetchRequest.set({ state: 'processing' });
    try {
      this.updateSelfWithApiResponseData(await getAPI(this.url));
      this.fetchRequest.set({ state: 'success' });
    } catch (error) {
      this.fetchRequest.set({
        state: 'failure',
        errors: [getErrorMessage(error)],
      });
    }
  }

  async updateField(columnId: number, value: unknown): Promise<void> {
    const body = { [columnId]: value };
    this.updateSelfWithApiResponseData(await patchAPI(this.url, body));
  }
}
