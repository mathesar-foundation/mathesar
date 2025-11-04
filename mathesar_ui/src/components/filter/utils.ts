import { find, first, zip } from 'iter-tools';

import type { ConstraintType } from '@mathesar/api/rpc/constraints';
import type { CellColumnLike } from '@mathesar/components/cell-fabric/types';
import type { getFiltersForAbstractType } from '@mathesar/stores/abstract-types';
import type {
  AbstractType,
  AbstractTypeFilterDefinition,
  AbstractTypeLimitedFilterInformation,
  FilterId,
} from '@mathesar/stores/abstract-types/types';
import type { ReadableMapLike } from '@mathesar/typeUtils';
import { isDefinedNonNullable } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

export interface FilterEntryColumn<ID> {
  id: ID;
  column: CellColumnLike;
  abstractType: AbstractType;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  simpleInputComponentAndProps: ComponentAndProps;
}

export interface IndividualFilter<ID> {
  type: 'individual';
  columnId: ID;
  conditionId: FilterId;
  value?: unknown;
}

export class FilterGroup<ID> {
  type = 'group' as const;

  operator: 'and' | 'or';

  args: (IndividualFilter<ID> | FilterGroup<ID>)[];

  constructor(props?: {
    operator: 'and' | 'or';
    args: (IndividualFilter<ID> | FilterGroup<ID>)[];
  }) {
    this.operator = props?.operator ?? 'and';
    this.args = props?.args ?? [];
  }

  addArgument(
    arg: IndividualFilter<ID> | FilterGroup<ID>,
    destinationIndex: number,
  ) {
    this.args.splice(destinationIndex, 0, arg);
    this.args = [...this.args];
  }

  removeArgument(arg: IndividualFilter<ID> | FilterGroup<ID>) {
    this.args = this.args.filter((a) => a !== arg);
  }

  withoutColumns(columnIds: ID[]): FilterGroup<ID> {
    return new FilterGroup<ID>({
      operator: this.operator,
      args: this.args.flatMap<FilterGroup<ID> | IndividualFilter<ID>>((e) => {
        if ('operator' in e) {
          return e.withoutColumns(columnIds);
        }
        return columnIds.includes(e.columnId) ? [] : [e];
      }),
    });
  }

  equals(filterGroup: FilterGroup<ID>) {
    if (this === filterGroup) {
      return true;
    }
    if (this.operator !== filterGroup.operator) {
      return false;
    }
    if (this.args.length !== filterGroup.args.length) {
      return false;
    }
    for (const [thisArg, thatArg] of zip(this.args, filterGroup.args)) {
      if (thisArg.type !== thatArg.type) {
        return false;
      }
      if (
        thisArg.type === 'group' &&
        thatArg.type === 'group' &&
        !thisArg.equals(thatArg)
      ) {
        return false;
      }
      if (thisArg.type === 'individual' && thatArg.type === 'individual') {
        if (
          thisArg.columnId !== thatArg.columnId ||
          thisArg.conditionId !== thatArg.conditionId ||
          thisArg.value !== thatArg.value
        ) {
          return false;
        }
      }
    }
    return true;
  }

  clone(): FilterGroup<ID> {
    return new FilterGroup({
      operator: this.operator,
      args: this.args.map((a) =>
        'operator' in a
          ? a.clone()
          : {
              type: a.type,
              columnId: a.columnId,
              conditionId: a.conditionId,
              value: a.value,
            },
      ),
    });
  }
}

export const FILTER_INPUT_CLASS = 'data-filter-input';

export function validateFilterEntry(
  filterCondition:
    | AbstractTypeFilterDefinition
    | AbstractTypeLimitedFilterInformation,
  value: unknown,
): boolean {
  if ('hasParams' in filterCondition) {
    if (!filterCondition.hasParams) {
      return value === undefined;
    }
  } else if (filterCondition.parameters.length === 0) {
    return value === undefined;
  }
  return isDefinedNonNullable(value) && String(value) !== '';
}

export function makeIndividualFilter<T>(
  columns: ReadableMapLike<FilterEntryColumn<T>['id'], FilterEntryColumn<T>>,
  getColumnConstraintType: (
    column: FilterEntryColumn<T>,
  ) => ConstraintType[] | undefined,
  columnId?: T,
): IndividualFilter<T> | undefined {
  const firstNonPrimaryColumn = find((c) => {
    const constraints = getColumnConstraintType(c);
    return !constraints || !constraints.includes('primary');
  }, columns.values());
  const defaultColumn = firstNonPrimaryColumn ?? first(columns.values());

  const filterColumn = columnId ? columns.get(columnId) : defaultColumn;

  if (!filterColumn) {
    return undefined;
  }

  const firstCondition = first(filterColumn.allowedFiltersMap.values());
  if (!firstCondition) {
    return undefined;
  }

  return {
    type: 'individual',
    columnId: filterColumn.id,
    conditionId: firstCondition.id,
    value: undefined,
  };
}
