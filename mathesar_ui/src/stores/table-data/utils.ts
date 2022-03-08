import {
  getGenericModificationStatusByPK,
  RECORD_COMBINED_STATE_KEY,
} from './meta';
import { getRowKey } from './records';
import type { Column } from './columns';
import type {
  ModificationStatus,
  ModificationType,
  ModificationStateMap,
} from './meta';
import type { TableRecord } from './records';

export function getGenericModificationStatus(
  recordModificationState: ModificationStateMap,
  row: TableRecord,
  primaryKeyColumn?: Column['id'],
): ModificationStatus {
  const key = getRowKey(row, primaryKeyColumn);
  return getGenericModificationStatusByPK(recordModificationState, key);
}

export function getModificationState(
  recordModificationState: ModificationStateMap,
  row: TableRecord,
  primaryKeyColumn?: Column['id'],
): ModificationType | undefined {
  const key = getRowKey(row, primaryKeyColumn);
  return recordModificationState.get(key)?.get(RECORD_COMBINED_STATE_KEY);
}
