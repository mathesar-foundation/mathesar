import { getGenericModificationStatusByPK } from './meta';
import { getRowKey } from './records';
import type { TableColumn } from './columns';
import type { ModificationStatus, ModificationType } from './meta';
import type { TableRecord } from './records';

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
