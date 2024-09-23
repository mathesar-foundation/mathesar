import type { Column } from '@mathesar/api/rpc/columns';
import type { ConstraintType } from '@mathesar/api/rpc/constraints';
import { type ValidationFn, uniqueWith } from '@mathesar/components/form';
import { iconConstraint, iconTableLink } from '@mathesar/icons';
import type { Table } from '@mathesar/models/Table';
import {
  abstractTypesMap,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { getAvailableName } from '@mathesar/utils/db';
import type { IconProps } from '@mathesar-component-library/types';

import { makeSingular } from './languageUtils';

export function getColumnIconProps(column: {
  type: Column['type'];
  type_options: Column['type_options'];
  constraintsType?: ConstraintType[];
}): IconProps | IconProps[] {
  if (column.constraintsType?.includes('primary')) {
    return iconConstraint;
  }

  if (column.constraintsType?.includes('foreignkey')) {
    return iconTableLink;
  }

  return getAbstractTypeForDbType(column.type, abstractTypesMap).getIcon({
    dbType: column.type,
    typeOptions: column.type_options,
  });
}

export function getSuggestedFkColumnName(
  targetTable: Pick<Table, 'name'> | undefined,
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

export function getColumnConstraintTypeByColumnId(
  columnId: number,
  processedColumns: Map<number, ProcessedColumn>,
) {
  const processedColumn = processedColumns.get(columnId);
  const constraintsType = Array.from(
    new Set(
      [
        ...(processedColumn?.exclusiveConstraints ?? []),
        ...(processedColumn?.sharedConstraints ?? []),
      ]
        .filter((constraintType) => !!constraintType)
        .map((constraintType) => constraintType.type),
    ),
  );
  return constraintsType;
}
