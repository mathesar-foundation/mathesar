import type { Column, ColumnTypeOptions } from '@mathesar/api/rpc/columns';
import type { ConstraintType } from '@mathesar/api/rpc/constraints';
import { type ValidationFn, uniqueWith } from '@mathesar/components/form';
import { iconConstraint, iconTableLink } from '@mathesar/icons';
import type { Table } from '@mathesar/models/Table';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
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

  return getAbstractTypeForDbType(column.type).getIcon({
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

export function columnTypeOptionsAreEqual(
  a: ColumnTypeOptions,
  b: ColumnTypeOptions,
): boolean {
  type TypeOption = keyof ColumnTypeOptions;
  // This weird object exists for type safety purposes. This way, if a new field
  // is added to ColumnTypeOptions, we'll get a type error here if we don't
  // update this object.
  const fieldsObj: Record<TypeOption, unknown> = {
    precision: null,
    scale: null,
    length: null,
    fields: null,
    item_type: null,
  };
  const fields = Object.keys(fieldsObj) as TypeOption[];

  for (const field of fields) {
    // The nullish coalescing here is important and kind of the main reason this
    // function exists. We need to make sure that if a field is missing from one
    // object while present but `null` in the other object, then the two objects
    // are still considered equal as far as comparing column type options goes.
    if ((a[field] ?? null) !== (b[field] ?? null)) {
      return false;
    }
  }
  return true;
}
