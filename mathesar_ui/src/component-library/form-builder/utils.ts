import type {
  ConditionalIfElement,
  ConditionalSwitchElement,
  FormElement,
} from './types';

function checkCondition(
  term: unknown,
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

export function computeSwitchElements(
  storeValue: unknown,
  switchArgs: { cases: ConditionalSwitchElement['cases'] },
): FormElement[] {
  const { cases } = switchArgs;
  return cases[String(storeValue)] ?? cases.default ?? [];
}

export function computeIfElements(
  storeValue: unknown,
  ifArgs: {
    condition: ConditionalIfElement['condition'];
    value: ConditionalIfElement['value'];
    elements: ConditionalIfElement['elements'];
  },
): FormElement[] {
  if (checkCondition(storeValue, ifArgs.condition, ifArgs.value)) {
    return ifArgs.elements ?? [];
  }
  return [];
}
