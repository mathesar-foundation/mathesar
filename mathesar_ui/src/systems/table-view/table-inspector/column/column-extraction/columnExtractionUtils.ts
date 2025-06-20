import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type {
  FkConstraint,
  RawConstraint,
} from '@mathesar/api/rpc/constraints';
import { isDefinedNonNullable } from '@mathesar/component-library';
import {
  type ValidationOutcome,
  invalid,
  valid,
} from '@mathesar/components/form';
import type { Table } from '@mathesar/models/Table';
import {
  type ProcessedColumn,
  constraintIsFk,
} from '@mathesar/stores/table-data';

import type { LinkedTable } from './columnExtractionTypes';

function getLinkedTable({
  fkConstraint,
  columns,
  tables,
}: {
  fkConstraint: FkConstraint;
  columns: Map<number, ProcessedColumn>;
  tables: Map<number, Table>;
}): LinkedTable | undefined {
  const table = tables.get(fkConstraint.referent_table_oid);
  if (!table) {
    return undefined;
  }
  return {
    constraint: fkConstraint,
    table,
    columns: fkConstraint.columns
      .map((columnId) => columns.get(columnId))
      .filter(isDefinedNonNullable),
  };
}

export function getLinkedTables({
  constraints,
  columns,
  tables,
}: {
  constraints: RawConstraint[];
  columns: Map<number, ProcessedColumn>;
  tables: Map<number, Table>;
}): LinkedTable[] {
  return constraints
    .map((c) =>
      constraintIsFk(c)
        ? getLinkedTable({ fkConstraint: c, columns, tables })
        : undefined,
    )
    .filter(isDefinedNonNullable);
}

export function validateTableIsNotLinkedViaSelectedColumn(
  linkedTable: LinkedTable,
  columns: ProcessedColumn[],
): ValidationOutcome {
  const offendingColumn = columns.find((selectedColumn) =>
    linkedTable.columns.some((c) => c.id === selectedColumn.id),
  );
  const msg = (c: string, t: string) =>
    get(_)('cannot_move_linked_column_to_linked_table', {
      values: { columnName: c, tableName: t },
    });
  return offendingColumn
    ? invalid(msg(offendingColumn.column.name, linkedTable.table.name))
    : valid();
}
