import type { AbstractTypeFilterDefinition } from '@mathesar/stores/abstract-types/types';

export function validateFilterEntry(
  filterCondition: AbstractTypeFilterDefinition,
  value: unknown,
): boolean {
  if (filterCondition.parameters.length === 0) {
    return typeof value === 'undefined';
  }
  return typeof value !== 'undefined' && value !== null && String(value) !== '';
}
