import type {
  FormInputDataType,
  ConditionalIfElement,
  ConditionalSwitchElement,
  FormElement,
} from './types';

function checkCondition(
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

export function computeSwitchElements(
  storeValue: FormInputDataType,
  switchArgs: { cases: ConditionalSwitchElement['cases'] },
): FormElement[] {
  const { cases } = switchArgs;
  return cases[String(storeValue)] ?? cases.default ?? [];
}

export function computeIfElements(
  storeValue: FormInputDataType,
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
