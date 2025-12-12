import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { invalidIf } from '@mathesar/components/form';
import type { Table } from '@mathesar/models/Table';
import { getAvailableName } from '@mathesar/utils/db';

export type LinkType = 'manyToOne' | 'oneToMany' | 'manyToMany';

export function columnNameIsNotId() {
  return invalidIf(
    (columnName: string) => columnName === 'id',
    get(_)('id_is_reserved_column'),
  );
}

export function suggestMappingTableName(
  baseTable: Pick<Table, 'name'>,
  targetTable: Pick<Table, 'name'> | undefined,
  allTables: Pick<Table, 'name'>[],
): string {
  return targetTable
    ? getAvailableName(
        `${baseTable.name}_${targetTable.name}`,
        new Set(allTables.map((t) => t.name)),
      )
    : '';
}
