import { type Writable, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { RecordsResponse } from '@mathesar/api/rpc/records';
import { WritableMap } from '@mathesar/component-library';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
import { buildRecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import { getErrorMessage } from '@mathesar/utils/errors';

export default class RecordStore {
  database: Pick<Database, 'id'>;

  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fieldValues = new WritableMap<number, unknown>();

  recordSummaries = new RecordSummaryStore();

  summary: Writable<string>;

  table: Table;

  recordPk: string;

  constructor({
    database,
    table,
    recordPk,
  }: {
    database: Pick<Database, 'id'>;
    table: Table;
    recordPk: string;
  }) {
    this.database = database;
    this.table = table;
    this.recordPk = recordPk;
    this.summary = writable('');
    void this.fetch();
  }

  private updateSelfWithApiResponseData(response: RecordsResponse): void {
    const result = response.results[0];
    this.fieldValues.reconstruct(
      Object.entries(result).map(([k, v]) => [parseInt(k, 10), v]),
    );
    this.summary.set(response.record_summaries?.[this.recordPk] ?? '');
    if (response.linked_record_summaries) {
      this.recordSummaries.setFetchedSummaries(
        buildRecordSummariesForSheet(response.linked_record_summaries),
      );
    }
  }

  async fetch(): Promise<void> {
    this.fetchRequest.set({ state: 'processing' });
    try {
      const response = await api.records
        .get({
          database_id: this.database.id,
          table_oid: this.table.oid,
          record_id: this.recordPk,
          return_record_summaries: true,
        })
        .run();
      this.updateSelfWithApiResponseData(response);
      this.fetchRequest.set({ state: 'success' });
    } catch (error) {
      this.fetchRequest.set({
        state: 'failure',
        errors: [getErrorMessage(error)],
      });
    }
  }

  async patch(payload: Record<string, unknown>) {
    const response = await api.records
      .patch({
        database_id: this.database.id,
        table_oid: this.table.oid,
        record_id: this.recordPk,
        record_def: payload,
        return_record_summaries: true,
      })
      .run();
    this.updateSelfWithApiResponseData(response);
  }
}
