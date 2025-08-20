import { type Writable, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { RecordsResponse } from '@mathesar/api/rpc/records';
import { WritableMap } from '@mathesar/component-library';
import type { Table } from '@mathesar/models/Table';
import { getRecordPageUrl } from '@mathesar/routes/urls';
import { TableStructure } from '@mathesar/stores/table-data';
import RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
import { buildRecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
import { getErrorMessage } from '@mathesar/utils/errors';

export default class RecordStore {
  tableStructure: TableStructure;

  fetchRequest = writable<RequestStatus | undefined>(undefined);

  /** Keys are column ids */
  fieldValues = new WritableMap<number, unknown>();

  recordSummaries = new RecordSummaryStore();

  summary: Writable<string>;

  table: Table;

  recordPk: string;

  recordPageUrl: string;

  constructor({ table, recordPk }: { table: Table; recordPk: string }) {
    const { schema } = table;
    this.tableStructure = new TableStructure({ schema, oid: table.oid });
    this.table = table;
    this.recordPk = recordPk;
    this.summary = writable('');
    this.recordPageUrl = getRecordPageUrl(
      table.schema.database.id,
      table.schema.oid,
      table.oid,
      recordPk,
    );
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
    const databaseId = this.table.schema.database.id;
    try {
      const response = await api.records
        .get({
          database_id: databaseId,
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
    const databaseId = this.table.schema.database.id;
    const response = await api.records
      .patch({
        database_id: databaseId,
        table_oid: this.table.oid,
        record_id: this.recordPk,
        record_def: payload,
        return_record_summaries: true,
      })
      .run();
    this.updateSelfWithApiResponseData(response);
  }
}
