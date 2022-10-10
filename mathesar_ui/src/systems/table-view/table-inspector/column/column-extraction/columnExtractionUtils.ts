import type { TableEntry } from '@mathesar/api/tables';
import type { FkConstraint } from '@mathesar/api/tables/constraints';
import { isDefinedNonNullable } from '@mathesar/component-library';
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
