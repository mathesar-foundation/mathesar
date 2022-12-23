import type { TableEntry } from '@mathesar/api/types/tables';
import { invalidIf } from '@mathesar/components/form';
import { getAvailableName } from '@mathesar/utils/db';

export const linkTypes = ['manyToOne', 'oneToMany', 'manyToMany'] as const;

export type LinkType = typeof linkTypes[number];

export const columnNameIsNotId = invalidIf(
  (columnName: string) => columnName === 'id',
  'The name "id" is reserved for the primary key column that will be ' +
    'created when creating the table.',
);

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
