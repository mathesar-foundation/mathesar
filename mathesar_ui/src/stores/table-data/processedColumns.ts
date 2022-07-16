import type { Readable } from 'svelte/store';
import type { Column } from '@mathesar/api/tables/columns';
import type {
  Constraint,
  FkConstraint,
} from '@mathesar/api/tables/constraints';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type {
  AbstractType,
  AbstractTypesMap,
} from '@mathesar/stores/abstract-types/types';
import {
  getFiltersForAbstractType,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import {
  getCellCap,
  getDbTypeBasedInputCap,
} from '@mathesar/components/cell-fabric/utils';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import { findFkConstraintsForColumn } from './constraintsUtils';

export interface ProcessedColumn extends CellColumnFabric {
  /**
   * This property is also available via `column.id`, but it's duplicated at a
   * higher level for brevity's sake because it's used so frequently.
   */
  id: Column['id'];
  column: Column;
  /** Constraints whose columns include only this column */
  exclusiveConstraints: Constraint[];
  /** Constraints whose columns include this column and other columns too */
  sharedConstraints: Constraint[];
  /**
   * Present when this column has one single-column FK constraint. In the
   * unlikely (but theoretically possible) scenario that this column has more
   * than one FK constraint, the first FK constraint is used.
   */
  linkFk: FkConstraint | undefined;
  abstractType: AbstractType;
  inputComponentAndProps: ComponentAndProps;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
}

/** Maps column ids to processed columns */
export type ProcessedColumnsStore = Readable<Map<number, ProcessedColumn>>;

export function processColumn(
  column: Column,
  constraints: Constraint[],
  abstractTypeMap: AbstractTypesMap,
): ProcessedColumn {
  const abstractType = getAbstractTypeForDbType(column.type, abstractTypeMap);
  const relevantConstraints = constraints.filter((c) =>
    c.columns.includes(column.id),
  );
  const exclusiveConstraints = relevantConstraints.filter(
    (c) => c.columns.length === 1,
  );
  const sharedConstraints = relevantConstraints.filter(
    (c) => c.columns.length !== 1,
  );
  const linkFk = findFkConstraintsForColumn(exclusiveConstraints, column.id)[0];
  return {
    id: column.id,
    column,
    exclusiveConstraints,
    sharedConstraints,
    linkFk,
    abstractType,
    cellComponentAndProps: getCellCap(
      abstractType.cell,
      column,
      linkFk ? linkFk.referent_table : undefined,
    ),
    inputComponentAndProps: getDbTypeBasedInputCap(
      column,
      constraints,
      abstractType.cell,
    ),
    allowedFiltersMap: getFiltersForAbstractType(abstractType.identifier),
  };
}
