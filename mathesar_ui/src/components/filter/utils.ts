/* eslint-disable max-classes-per-file */

import { find, first, zip } from 'iter-tools';
import { type Writable, get, writable } from 'svelte/store';

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

export interface FilterEntryColumn {
  id: string;
  column: CellColumnLike;
  abstractType: AbstractType;
  allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;
  simpleInputComponentAndProps: ComponentAndProps;
}

export interface RawIndividualFilter {
  type: 'individual';
  columnId: string;
  conditionId: FilterId;
  value?: unknown;
}

export class IndividualFilter {
  type = 'individual' as const;

  columnId: Writable<string>;

  conditionId: Writable<FilterId>;

  value: Writable<unknown | undefined>;

  constructor(props: RawIndividualFilter) {
    this.columnId = writable(props.columnId);
    this.conditionId = writable(props.conditionId);
    this.value = writable(props.value);
  }

  toRaw(): RawIndividualFilter {
    return {
      type: 'individual',
      columnId: get(this.columnId),
      conditionId: get(this.conditionId),
      value: get(this.value),
    };
  }
}

export interface RawFilterGroup {
  type: 'group';
  operator: 'and' | 'or' | 'not';
  args: (RawIndividualFilter | RawFilterGroup)[];
}

export class FilterGroup {
  type = 'group' as const;

  operator: Writable<RawFilterGroup['operator']>;

  args: Writable<(IndividualFilter | FilterGroup)[]>;

  constructor(props?: RawFilterGroup) {
    this.operator = writable(props?.operator ?? 'and');
    this.args = writable(
      props?.args.map((arg) => {
        if (arg.type === 'group') {
          return new FilterGroup(arg);
        }
        return new IndividualFilter(arg);
      }) ?? [],
    );
  }

  addArgument(arg: IndividualFilter | FilterGroup, destinationIndex?: number) {
    this.args.update((args) => {
      const insertionIndex = destinationIndex ?? args.length;
      args.splice(insertionIndex, 0, arg);
      return [...args];
    });
  }

  removeArgument(arg: IndividualFilter | FilterGroup) {
    this.args.update((args) => args.filter((a) => a !== arg));
  }

  equalsRaw(rawFilterGroup: RawFilterGroup) {
    if (get(this.operator) !== rawFilterGroup.operator) {
      return false;
    }
    const thisArgs = get(this.args);
    if (thisArgs.length !== rawFilterGroup.args.length) {
      return false;
    }
    for (const [thisArg, thatArg] of zip(thisArgs, rawFilterGroup.args)) {
      if (thisArg.type !== thatArg.type) {
        return false;
      }
      if (
        thisArg.type === 'group' &&
        thatArg.type === 'group' &&
        !thisArg.equalsRaw(thatArg)
      ) {
        return false;
      }
      if (thisArg.type === 'individual' && thatArg.type === 'individual') {
        if (
          get(thisArg.columnId) !== thatArg.columnId ||
          get(thisArg.conditionId) !== thatArg.conditionId ||
          get(thisArg.value) !== thatArg.value
        ) {
          return false;
        }
      }
    }
    return true;
  }

  toRaw(): RawFilterGroup {
    return {
      type: 'group',
      operator: get(this.operator),
      args: get(this.args).map((a) => a.toRaw()),
    };
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

export function makeIndividualFilter(
  columns: ReadableMapLike<FilterEntryColumn['id'], FilterEntryColumn>,
  getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined,
  columnId?: string,
): IndividualFilter | undefined {
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

  return new IndividualFilter({
    type: 'individual',
    columnId: filterColumn.id,
    conditionId: firstCondition.id,
    value: undefined,
  });
}

export function calcNumberOfIndividualFilters(
  rawFilterGroup: RawFilterGroup,
): number {
  return rawFilterGroup.args.reduce((count, entry) => {
    if (entry.type === 'group') {
      return count + calcNumberOfIndividualFilters(entry);
    }
    return count + 1;
  }, 0);
}

/* eslint-enable max-classes-per-file */
