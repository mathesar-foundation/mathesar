import { getGenericModificationStatusByPK } from './meta';
import type { TableColumn } from './columns';
import type { ModificationStatus, ModificationType } from './meta';
import type { TableRecord } from './records';

function getRowKey(
  row: TableRecord,
  primaryKeyColumn?: TableColumn['name'],
): unknown {
  let key = row?.[primaryKeyColumn];
  if (!key && row?.__isNew) {
    key = row?.__identifier;
  }
  return key;
}

export function getGenericModificationStatus(
  modificationStatus: Map<unknown, ModificationType>,
  row: TableRecord,
  primaryKeyColumn?: TableColumn['name'],
): ModificationStatus {
  const key = getRowKey(row, primaryKeyColumn);
  return getGenericModificationStatusByPK(modificationStatus, key);
}

export function getModificationState(
  modificationStatus: Map<unknown, ModificationType>,
  row: TableRecord,
  primaryKeyColumn?: TableColumn['name'],
): ModificationType {
  const key = getRowKey(row, primaryKeyColumn);
  return modificationStatus.get(key);
}
