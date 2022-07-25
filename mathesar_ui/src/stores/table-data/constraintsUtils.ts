import type {
  Constraint,
  FkConstraint,
} from '@mathesar/api/tables/constraints';
import type { Column } from '@mathesar/api/tables/columns';

export function constraintIsFk(c: Constraint): c is FkConstraint {
  return c.type === 'foreignkey';
}

/**
 * Return all the single-column foreign key constraints which are set for the
 * given column.
 *
 * Theoretically, there can be multiple foreign key constraints set for one
 * column, so we return an array, but in practice that would unexpected -- so
 * it's up to the caller of this function to decide what to do in that case.
 */
export function findFkConstraintsForColumn(
  constraints: Constraint[],
  columnId: Column['id'],
): FkConstraint[] {
  return constraints.filter(constraintIsFk).filter(
    (constraint) =>
      constraint.columns.length === 1 && // only single-column foreign keys
      constraint.columns.includes(columnId),
  );
}
