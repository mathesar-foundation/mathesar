import type { FkConstraint } from '@mathesar/api/types/tables/constraints';
import { isDefinedNonNullable } from '@mathesar-component-library';
import {
  getEqualityFiltersForAbstractType,
  getFiltersForAbstractType,
} from '@mathesar/stores/abstract-types';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypeFilterDefinition,
  AbstractTypeLimitedFilterInformation,
} from '@mathesar/stores/abstract-types/types';

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

export function retrieveFilters(
  categoryIdentifier: AbstractTypeCategoryIdentifier,
  linkFK?: FkConstraint,
): Map<AbstractTypeFilterDefinition['id'], AbstractTypeFilterDefinition> {
  const isFK: boolean = linkFK !== undefined;
  return isFK
    ? getEqualityFiltersForAbstractType(categoryIdentifier)
    : getFiltersForAbstractType(categoryIdentifier);
}
