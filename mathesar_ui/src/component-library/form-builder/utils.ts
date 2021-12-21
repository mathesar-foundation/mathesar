import type { LayoutConditionalIfElement } from './types.d';

export function checkCondition(
  term: unknown,
  condition: LayoutConditionalIfElement['condition'],
  value: LayoutConditionalIfElement['value'],
): boolean {
  if (condition === 'eq') {
    return term === value;
  }
  if (condition === 'neq') {
    return term !== value;
  }
  return false;
}
