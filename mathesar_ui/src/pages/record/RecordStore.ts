import { derived, writable, type Readable } from 'svelte/store';

import type { TableEntry } from '@mathesar/api/types/tables';
import type { Response as ApiResponse } from '@mathesar/api/types/tables/records';
import { WritableMap } from '@mathesar/component-library';
import {
  renderTransitiveRecordSummary,
  prepareFieldsAsRecordSummaryInputData,
  buildRecordSummariesForSheet,
} from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import {
  getAPI,
  patchAPI,
  type RequestStatus,
} from '@mathesar/api/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';
import RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';

export default class RecordStore {
  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fieldValues = new WritableMap<number, unknown>();

  recordSummaries = new RecordSummaryStore();

  summary: Readable<string>;

  table: TableEntry;

  recordPk: string;

  private url: string;

  constructor({ table, recordPk }: { table: TableEntry; recordPk: string }) {
    this.table = table;
    this.recordPk = recordPk;
    this.url = `/api/db/v0/tables/${this.table.id}/records/${this.recordPk}/`;
    const { template } = this.table.settings.preview_settings;
    this.summary = derived(
      [this.fieldValues, this.recordSummaries],
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
    this.fieldValues.reconstruct(
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

  async patch(payload: Record<string, unknown>) {
    this.updateSelfWithApiResponseData(await patchAPI(this.url, payload));
  }
}
