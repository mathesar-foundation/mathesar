import type { FkConstraint } from '@mathesar/api/tables/constraints';
import { getFiltersForAbstractType } from '@mathesar/stores/abstract-types';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypeFilterDefinition,
} from '@mathesar/stores/abstract-types/types';

export function validateFilterEntry(
  filterCondition: AbstractTypeFilterDefinition,
  value: unknown,
): boolean {
  if (filterCondition.parameters.length === 0) {
    return typeof value === 'undefined';
  }
  return typeof value !== 'undefined' && value !== null && String(value) !== '';
}

export function retrieveFilters(
  categoryIdentifier: AbstractTypeCategoryIdentifier,
  linkFK: FkConstraint,
): Map<AbstractTypeFilterDefinition['id'], AbstractTypeFilterDefinition> {
  let allowedFiltersMap: Map<
    AbstractTypeFilterDefinition['id'],
    AbstractTypeFilterDefinition
  > = new Map();
  const isFK: boolean = linkFK !== undefined;

  allowedFiltersMap = getFiltersForAbstractType(categoryIdentifier, isFK);

  return allowedFiltersMap;
}
