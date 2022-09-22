import type { Readable } from 'svelte/store';
import { writable, derived } from 'svelte/store';

import type { TableEntry } from '@mathesar/api/tables';
import { WritableMap } from '@mathesar/component-library';
import type { RequestStatus } from '@mathesar/utils/api';
import { patchAPI, getAPI } from '@mathesar/utils/api';
import { getErrorMessage } from '@mathesar/utils/errors';
import type { Response as ApiResponse } from '@mathesar/api/tables/records';
import { renderSummaryFromFieldsAndFkData } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import type { DataForRecordSummaryInFkCell } from '@mathesar/stores/table-data/record-summaries/recordSummaryTypes';

export default class RecordStore {
  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fields = new WritableMap<number, unknown>();

  /** Keys are column ids */
  fkSummaryData = new WritableMap<number, DataForRecordSummaryInFkCell>();

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
      [this.fields, this.fkSummaryData],
      ([fields, fkSummaryData]) =>
        renderSummaryFromFieldsAndFkData(template, fields, fkSummaryData),
    );
    void this.fetch();
  }

  private setFieldsFromResponse(response: ApiResponse): void {
    const result = response.results[0];
    this.fields.reconstruct(
      Object.entries(result).map(([k, v]) => [parseInt(k, 10), v]),
    );
    if (response.preview_data) {
      this.fkSummaryData.reconstruct(
        response.preview_data.map(({ column, template, data }) => [
          column,
          { column, template, data: data[0] },
        ]),
      );
    }
  }

  async fetch(): Promise<void> {
    this.fetchRequest.set({ state: 'processing' });
    try {
      this.setFieldsFromResponse(await getAPI(this.url));
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
    this.setFieldsFromResponse(await patchAPI(this.url, body));
  }
}
