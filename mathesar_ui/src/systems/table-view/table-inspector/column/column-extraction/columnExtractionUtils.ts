import type { TableEntry } from '@mathesar/api/types/tables';
import type { FkConstraint } from '@mathesar/api/types/tables/constraints';
import { isDefinedNonNullable } from '@mathesar/component-library';
import {
  type ValidationOutcome,
  invalid,
  valid,
} from '@mathesar/components/form';
import {
  constraintIsFk,
  type Constraint,
  type ProcessedColumn,
} from '@mathesar/stores/table-data';

import type { LinkedTable } from './columnExtractionTypes';

function getLinkedTable({
  fkConstraint,
  columns,
  tables,
}: {
  fkConstraint: FkConstraint;
  columns: Map<number, ProcessedColumn>;
  tables: Map<number, TableEntry>;
}): LinkedTable | undefined {
  const table = tables.get(fkConstraint.referent_table);
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
  constraints: Constraint[];
  columns: Map<number, ProcessedColumn>;
  tables: Map<number, TableEntry>;
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
    `Cannot move linking column "${c}" to its linked table "${t}".`;
  return offendingColumn
    ? invalid(msg(offendingColumn.column.name, linkedTable.table.name))
    : valid();
}
