import type { Readable } from 'svelte/store';
import { derived } from 'svelte/store';

import type { TableEntry } from '@mathesar/api/tables';
import { WritableMap } from '@mathesar/component-library';
import type { RequestStatus } from '@mathesar/utils/api';
import { patchAPI, getAPI } from '@mathesar/utils/api';
import { getErrorMessage } from '@mathesar/utils/errors';
import type { Response as ApiResponse } from '@mathesar/api/tables/records';
import { renderRecordSummaryFromFieldsMap } from '@mathesar/utils/recordSummary';

export default class RecordStore {
  fetchRequest: RequestStatus | undefined;

  /** Keys are column ids */
  fields = new WritableMap<number, unknown>();

  summary: Readable<string>;

  table: TableEntry;

  recordId: number;

  private url: string;

  constructor({ table, recordId }: { table: TableEntry; recordId: number }) {
    this.table = table;
    this.recordId = recordId;
    this.url = `/api/db/v0/tables/${this.table.id}/records/${this.recordId}/`;
    const { template } = this.table.settings.preview_settings;
    this.summary = derived(this.fields, (fields) =>
      renderRecordSummaryFromFieldsMap(template, fields),
    );
    void this.fetch();
  }

  private setFieldsFromResponse(response: ApiResponse): void {
    const result = response.results[0];
    this.fields.reconstruct(
      Object.entries(result).map(([k, v]) => [parseInt(k, 10), v]),
    );
  }

  async fetch(): Promise<void> {
    this.fetchRequest = { state: 'processing' };
    try {
      this.setFieldsFromResponse(await getAPI(this.url));
      this.fetchRequest = { state: 'success' };
    } catch (error) {
      this.fetchRequest = {
        state: 'failure',
        errors: [getErrorMessage(error)],
      };
    }
  }

  async updateField(columnId: number, value: unknown): Promise<void> {
    const body = { [columnId]: value };
    this.setFieldsFromResponse(await patchAPI(this.url, body));
  }
}
