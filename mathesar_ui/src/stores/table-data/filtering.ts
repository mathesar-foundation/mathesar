/* eslint-disable max-classes-per-file */

import type {
  RecordsListParams,
  SqlColumn,
  SqlComparison,
  SqlExpr,
  SqlFunction,
  SqlLiteral,
} from '@mathesar/api/rpc/records';
import { isDefinedNonNullable } from '@mathesar/component-library';
import {
  FilterGroup,
  type IndividualFilter,
} from '@mathesar/components/filter/utils';

import type { FilterId } from '../abstract-types/types';

/**
 * This function is glue code between the old filtering system (circa 2023) and
 * the new filtering system (circa 2024).
 *
 * At the API layer, the old filtering system was relatively flat and not very
 * flexible.
 *
 * The new filtering system is much more flexible and can handle complex
 * filtering expressions with arbitrary nesting. Brent introduced this new
 * system when moving the filtering logic from the service layer to the DB
 * layer. As a result, the API changed. But in an effort to minimize disturbance
 * within the front end, we introduced this compatibility layer.
 *
 * The `IndividualFilter` argument to this function is a data structure from the
 * _old_ filtering system. It is consistent with the behavior of the UI and the
 * data structures used for filtering throughout the front end. The `SqlExpr`
 * return value is a data structure from the _new_ filtering system. It is
 * consistent with the behavior of the API.
 *
 * If, at some point, we'd like to design a more flexible user-facing filtering
 * UI, then we could model that UI (and the resulting front end data structures)
 * around the `SqlExpr` data structure. This would allow us to avoid the need
 * for this compatibility layer.
 */
function individualFilterToSqlExpr(
  individualFilter: IndividualFilter<number>,
): SqlExpr {
  const column: SqlColumn = {
    type: 'attnum',
    value: individualFilter.columnId,
  };

  /** Generate an SqlLiteral value */
  function value(v = individualFilter.value): SqlLiteral {
    if (v === null || typeof v === 'string' || typeof v === 'number') {
      return { type: 'literal', value: v };
    }

    return { type: 'literal', value: JSON.stringify(v) };
  }

  /** Generate an SqlComparison */
  function cmp(
    type: SqlComparison['type'],
    args: [SqlExpr, SqlExpr] = [column, value()],
  ): SqlComparison {
    return { type, args };
  }

  /** Generate an SqlFunction */
  function fn(type: SqlFunction['type'], arg: SqlExpr = column): SqlFunction {
    return { type, args: [arg] };
  }

  /** Generate an SqlComparison of a JSON array length vs a value */
  function arrayLengthCmp(
    type: SqlComparison['type'],
    v = value(),
  ): SqlComparison {
    return cmp(type, [fn('json_array_length'), v]);
  }

  const compatibilityMap: Record<FilterId, SqlExpr> = {
    contains_case_insensitive: cmp('contains_case_insensitive'),
    email_domain_contains: cmp('contains', [fn('email_domain'), value()]),
    email_domain_equals: cmp('equal', [fn('email_domain'), value()]),
    equal: cmp('equal'),
    greater_or_equal: cmp('greater_or_equal'),
    greater: cmp('greater'),
    json_array_contains: cmp('json_array_contains'),
    json_array_length_equals: arrayLengthCmp('equal'),
    json_array_length_greater_or_equal: arrayLengthCmp('greater_or_equal'),
    json_array_length_greater_than: arrayLengthCmp('greater'),
    json_array_length_less_or_equal: arrayLengthCmp('lesser_or_equal'),
    json_array_length_less_than: arrayLengthCmp('lesser'),
    json_array_not_empty: arrayLengthCmp('greater', value(0)),
    lesser_or_equal: cmp('lesser_or_equal'),
    lesser: cmp('lesser'),
    not_null: fn('not_null'),
    null: fn('null'),
    starts_with_case_insensitive: cmp('starts_with'),
    uri_authority_contains: cmp('contains', [fn('uri_authority'), value()]),
    uri_scheme_equals: cmp('equal', [fn('uri_scheme'), value()]),
  };

  return compatibilityMap[individualFilter.conditionId];
}

type TerseIndividualFilter = ['i', number, FilterId, unknown];

type TerseFilterGroup = [
  'g',
  FilterGroup<number>['operator'],
  (TerseIndividualFilter | TerseFilterGroup)[],
];

export type TerseFiltering = TerseFilterGroup;

function makeTerseIndividualFilter(
  entry: IndividualFilter<number>,
): TerseIndividualFilter {
  return ['i', entry.columnId, entry.conditionId, entry.value];
}

function makeTerseFilterGroup(
  filterGroup: FilterGroup<number>,
): TerseFilterGroup {
  return [
    'g',
    filterGroup.operator,
    filterGroup.args.map((entry) =>
      'operator' in entry
        ? makeTerseFilterGroup(entry)
        : makeTerseIndividualFilter(entry),
    ),
  ];
}

function makeIndividualFilter(
  terseIndividualFilter: TerseIndividualFilter,
): IndividualFilter<number> {
  return {
    type: 'individual',
    columnId: terseIndividualFilter[1],
    conditionId: terseIndividualFilter[2],
    value: terseIndividualFilter[3],
  };
}

function makeFilterGroup(
  terseFilterGroup: TerseFilterGroup,
): FilterGroup<number> {
  return new FilterGroup<number>({
    operator: terseFilterGroup[1],
    args: terseFilterGroup[2].map((e) =>
      e[0] === 'i' ? makeIndividualFilter(e) : makeFilterGroup(e),
    ),
  });
}

function containsLiteral(expr: SqlExpr): boolean {
  if (expr.type === 'literal') {
    return true;
  }
  if ('args' in expr) {
    for (const arg of expr.args) {
      if (containsLiteral(arg)) {
        return true;
      }
    }
  }
  return false;
}

function isValueInvalid(v?: unknown) {
  if (typeof v === 'string') {
    return v.trim() === '';
  }
  return !isDefinedNonNullable(v);
}

function getCountOfNonConjunctionalExpr(expr: SqlExpr) {
  let count = 0;
  if ('args' in expr) {
    if (expr.type !== 'and' && expr.type !== 'or') {
      count += 1;
    }
    for (const arg of expr.args) {
      count += getCountOfNonConjunctionalExpr(arg);
    }
  }
  return count;
}

function getCountOfColumnInExpr(expr: SqlExpr, columnId: number): number {
  if (expr.type === 'attnum' && expr.value === columnId) {
    return 1;
  }
  let count = 0;
  if ('args' in expr) {
    for (const arg of expr.args) {
      count += getCountOfColumnInExpr(arg, columnId);
    }
  }
  return count;
}

/** This method disregards any invalid values */
function filterGroupToSqlExpr(group: FilterGroup<number>): SqlExpr | undefined {
  if (group.args.length === 0) {
    return undefined;
  }

  function toSQLExpr(entry: FilterGroup<number> | IndividualFilter<number>) {
    if ('operator' in entry) {
      return filterGroupToSqlExpr(entry);
    }
    const filterSqlExpr = individualFilterToSqlExpr(entry);
    if (containsLiteral(filterSqlExpr) && isValueInvalid(entry.value)) {
      return undefined;
    }
    return filterSqlExpr;
  }

  if (group.args.length === 1) {
    const entry = group.args[0];
    return toSQLExpr(entry);
  }

  let expr = toSQLExpr(group.args[0]);

  for (let i = 1; i < group.args.length; i += 1) {
    const joinedExpr = toSQLExpr(group.args[i]);
    if (expr !== undefined && joinedExpr) {
      expr = {
        type: group.operator,
        args: [expr, joinedExpr],
      };
    } else if (joinedExpr) {
      expr = joinedExpr;
    }
  }

  return expr;
}

export class Filtering {
  readonly root: FilterGroup<number>;

  readonly sqlExpr: SqlExpr | undefined;

  readonly appliedFilterCount: number;

  constructor(rootGroup?: FilterGroup<number>) {
    this.root =
      rootGroup ??
      new FilterGroup({
        operator: 'and',
        args: [],
      });
    this.sqlExpr = filterGroupToSqlExpr(this.root);
    this.appliedFilterCount = this.sqlExpr
      ? getCountOfNonConjunctionalExpr(this.sqlExpr)
      : 0;
  }

  withoutColumns(columnIds: number[]): Filtering {
    return new Filtering(this.root.withoutColumns(columnIds));
  }

  withContextualFilters(contextualFilters: Map<number, unknown>): Filtering {
    const contextualFilterEntries: IndividualFilter<number>[] = [
      ...contextualFilters,
    ].map(([columnId, value]) => ({
      type: 'individual',
      columnId,
      conditionId: 'equal',
      value,
    }));

    return new Filtering(
      new FilterGroup<number>({
        operator: 'and',
        args: [this.root, ...contextualFilterEntries],
      }),
    );
  }

  terse(): TerseFiltering {
    return makeTerseFilterGroup(this.root);
  }

  static fromTerse(terse: TerseFiltering): Filtering {
    return new Filtering(makeFilterGroup(terse));
  }

  appliedFilterCountForColumn(columnId: number): number {
    return this.sqlExpr ? getCountOfColumnInExpr(this.sqlExpr, columnId) : 0;
  }

  recordsRequestParams(): Pick<RecordsListParams, 'filter'> {
    return this.sqlExpr ? { filter: this.sqlExpr } : {};
  }
}

/* eslint-enable max-classes-per-file */
