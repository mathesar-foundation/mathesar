import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type {
  ColumnTypeOptions,
  RawColumnWithMetadata,
} from '@mathesar/api/rpc/columns';
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
  type: RawColumnWithMetadata['type'];
  type_options: RawColumnWithMetadata['type_options'];
  constraintsType?: ConstraintType[];
  metadata: ColumnMetadata | null;
}): IconProps | IconProps[] {
  if (column.constraintsType?.includes('primary')) {
    return iconConstraint;
  }

  if (column.constraintsType?.includes('foreignkey')) {
    return iconTableLink;
  }

  return getAbstractTypeForDbType(column.type, column.metadata).getIcon({
    dbType: column.type,
    typeOptions: column.type_options,
    metadata: column.metadata,
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
  const fieldsObj: Record<TypeOption, unknown> = {
    precision: null,
    scale: null,
    length: null,
    fields: null,
    item_type: null,
  };
  const fields = Object.keys(fieldsObj) as TypeOption[];

  for (const field of fields) {
    if ((a[field] ?? null) !== (b[field] ?? null)) {
      return false;
    }
  }
  return true;
}

/**
 * Safely parses a column ID to a number without throwing errors (NEW).
 */
export function parseColumnId(
  id: string | number | undefined | null,
): number | undefined {
  if (id == null || id === '') {
    return undefined;
  }

  if (typeof id === 'number') {
    return Number.isNaN(id) ? undefined : id;
  }

  const parsed = Number(id);
  return Number.isNaN(parsed) ? undefined : parsed;
}
