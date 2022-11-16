import type { Column } from '@mathesar/api/tables/columns';

export type ColumnLike = Pick<Column, 'id' | 'name'>;

/**
 * Conformant columns can be displayed by name within the UI template. A column
 * is conformant as long as its name does not contain any curly braces.
 *
 * Nonconformant columns can still be inserted into the template, but they will
 * be displayed by ID instead of name.
 */
export function columnIsConformant(column: ColumnLike): boolean {
  return !column.name.match(/[{}]/);
}

export function getColumnsInTemplate({
  columns,
  template,
}: {
  columns: Column[];
  template: string;
}) {
  const matches = template.match(/\{\d+\}/g) ?? [];
  const columnIds = matches.map((m) => parseInt(m.slice(1, -1), 10));
  return columns.filter((c) => columnIds.includes(c.id));
}
