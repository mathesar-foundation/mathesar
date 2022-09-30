import { derived, writable, type Readable, type Writable } from 'svelte/store';

import type { TableEntry } from '@mathesar/api/tables';
import type { Response as ApiResponse } from '@mathesar/api/tables/records';
import { ImmutableMap, WritableMap } from '@mathesar/component-library';
import {
  renderTransitiveRecordSummary,
  prepareFieldsAsRecordSummaryInputData,
  buildDataForRecordSummariesInFkColumns,
  type DataForRecordSummariesInFkColumns,
} from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import { getAPI, patchAPI, type RequestStatus } from '@mathesar/utils/api';
import { getErrorMessage } from '@mathesar/utils/errors';

export default class RecordStore {
  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fields = new WritableMap<number, unknown>();

  dataForRecordSummariesInFkColumns: Writable<DataForRecordSummariesInFkColumns> =
    writable(new ImmutableMap());

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
      [this.fields, this.dataForRecordSummariesInFkColumns],
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
      this.dataForRecordSummariesInFkColumns.set(
        buildDataForRecordSummariesInFkColumns(response.preview_data),
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
