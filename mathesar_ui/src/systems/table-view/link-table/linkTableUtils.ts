import type { TableEntry } from '@mathesar/api/types/tables';
import { invalidIf } from '@mathesar/components/form';
import { getAvailableName } from '@mathesar/utils/db';
import { makeSingular } from '@mathesar/utils/languageUtils';

export const linkTypes = ['oneToMany', 'manyToOne', 'manyToMany'] as const;

export type LinkType = typeof linkTypes[number];

export const columnNameIsNotId = invalidIf(
  (columnName: string) => columnName === 'id',
  'The name "id" is reserved for the primary key column that will be ' +
    'created when creating the table.',
);

export function suggestFkColumnName(
  targetTable: Pick<TableEntry, 'name'> | undefined,
  existingColumns: Set<string> = new Set('id'),
): string {
  return targetTable
    ? getAvailableName(makeSingular(targetTable.name), existingColumns)
    : '';
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
