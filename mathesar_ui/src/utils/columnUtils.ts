import { get } from 'svelte/store';

import type { IconProps } from '@mathesar-component-library/types';
import type { TableEntry } from '@mathesar/api/types/tables';
import type { DisplayColumn } from '@mathesar/components/column/types';
import { uniqueWith, type ValidationFn } from '@mathesar/components/form';
import { iconConstraint, iconTableLink } from '@mathesar/icons';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import { getAvailableName } from '@mathesar/utils/db';
import { makeSingular } from './languageUtils';

export function getColumnIconProps(
  _column: DisplayColumn,
): IconProps | IconProps[] {
  if (_column.constraintsType?.includes('primary')) {
    return iconConstraint;
  }

  if (_column.constraintsType?.includes('foreignkey')) {
    return iconTableLink;
  }

  return getAbstractTypeForDbType(
    _column.type,
    get(currentDbAbstractTypes)?.data,
  ).getIcon({
    dbType: _column.type,
    typeOptions: _column.type_options,
  });
}

export function getSuggestedFkColumnName(
  targetTable: Pick<TableEntry, 'name'> | undefined,
  existingColumns: { name: string }[] = [{ name: 'id' }],
): string {
  const columnNames = new Set(existingColumns.map((c) => c.name));
  return targetTable
    ? getAvailableName(makeSingular(targetTable.name), columnNames)
    : '';
}

export function columnNameIsAvailable(
  columns: { name: string }[],
): ValidationFn<string> {
  const msg = 'A column with that name already exists';
  return uniqueWith(
    columns.map((c) => c.name),
    msg,
  );
}
