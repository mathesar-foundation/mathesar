import { type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  RecordsSummaryListResponse,
  SummarizedRecordReference,
} from '@mathesar/api/rpc/_common/commonTypes';
import type { ResultValue } from '@mathesar/api/rpc/records';

import type MultiTaggerController from './MultiTaggerController';
import { MultiTaggerOption } from './MultiTaggerOption';

export function* getOptions(
  response: RecordsSummaryListResponse | undefined,
): Generator<Writable<MultiTaggerOption>> {
  if (!response) return;
  const joinedValues = response.mapping?.joined_values ?? {};
  for (const { key, summary } of response.results) {
    const mappingIds = joinedValues[String(key)];
    yield writable(new MultiTaggerOption({ key, summary, mappingIds }));
  }
}

function getJoinTableOid(controller: MultiTaggerController): number {
  const records = get(controller.records);
  const joinTableOid = records.resolvedValue?.mapping?.join_table;
  if (joinTableOid === undefined) {
    throw new Error('Join table OID is undefined');
  }
  return joinTableOid;
}

export async function addMapping(
  controller: MultiTaggerController,
  recordKey: SummarizedRecordReference['key'],
): Promise<ResultValue> {
  const { database, intermediateTable, currentRecordPk } = controller.props;
  const targetFkAttnum = String(intermediateTable.attnumOfFkToTargetTable);
  const currentFkAttnum = String(intermediateTable.attnumOfFkToCurrentTable);
  const response = await api.records
    .add({
      database_id: database.id,
      table_oid: getJoinTableOid(controller),
      record_def: {
        [targetFkAttnum]: recordKey,
        [currentFkAttnum]: currentRecordPk,
      },
    })
    .run();
  const resultRow = response.results[0];
  const pkAttnum = Object.keys(resultRow).find(
    ([attnum]) => ![targetFkAttnum, currentFkAttnum].includes(attnum),
  );
  if (!pkAttnum) {
    throw new Error('Unable to determine PK attnum');
  }
  return resultRow[pkAttnum];
}

export async function removeMapping(
  controller: MultiTaggerController,
  mappingIds: ResultValue[],
) {
  await api.records
    .delete({
      database_id: controller.props.database.id,
      table_oid: getJoinTableOid(controller),
      record_ids: mappingIds,
    })
    .run();
}
