import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { TableEntry } from '@mathesar/api/rest/types/tables';
import { invalidIf } from '@mathesar/components/form';
import { getAvailableName } from '@mathesar/utils/db';

export type LinkType = 'manyToOne' | 'oneToMany' | 'manyToMany';

export function columnNameIsNotId() {
  return invalidIf(
    (columnName: string) => columnName === 'id',
    get(_)('id_is_reserved_column'),
  );
}

export function suggestMappingTableName(
  baseTable: Pick<TableEntry, 'name'>,
  targetTable: Pick<TableEntry, 'name'> | undefined,
  allTables: Pick<TableEntry, 'name'>[],
): string {
  return targetTable
    ? getAvailableName(
        `${baseTable.name}_${targetTable.name}`,
        new Set(allTables.map((t) => t.name)),
      )
    : '';
}
