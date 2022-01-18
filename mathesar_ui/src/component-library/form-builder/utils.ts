import type { FormInputDataType, ConditionalIfElement } from './types.d';

export function checkCondition(
  term: FormInputDataType,
  condition: ConditionalIfElement['condition'],
  value: ConditionalIfElement['value'],
): boolean {
  if (condition === 'eq') {
    return term === value;
  }
  if (condition === 'neq') {
    return term !== value;
  }
  return false;
}
