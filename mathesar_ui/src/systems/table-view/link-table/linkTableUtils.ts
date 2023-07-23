import type { TableEntry } from '@mathesar/api/types/tables';
import { invalidIf } from '@mathesar/components/form';
import { standaloneTranslator } from '@mathesar/i18n/standalone-translator';
import { getAvailableName } from '@mathesar/utils/db';

export type LinkType = 'manyToOne' | 'oneToMany' | 'manyToMany';

export const columnNameIsNotId = invalidIf(
  (columnName: string) => columnName === 'id',
  standaloneTranslator().linkTableUtils.ifColumnNameIsId(),
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
