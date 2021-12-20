import type { DynamicInputType, DynamicInputSelectElement, EnumSelectOption } from './types';

export function generateSelectOptions(
  type: DynamicInputType,
  enumValues?: unknown[],
  options?: DynamicInputSelectElement['options'],
): EnumSelectOption[] {
  if (type === 'boolean') {
    return [
      {
        value: true,
        label: options?.true?.label ?? 'True',
      },
      {
        value: false,
        label: options?.false?.label ?? 'False',
      },
    ];
  }

  // Treat all other types in a similar manner to string
  return enumValues?.map((value: string) => ({
    value,
    label: options?.[value]?.label ?? value,
  })) || [];
}

export function getSelectedValue(
  options: EnumSelectOption[],
  value: unknown,
): EnumSelectOption {
  return options.find((elem) => elem.value === value);
}

export function getInitialValue(
  type: DynamicInputType,
  enumValues?: unknown[],
): unknown {
  if (type === 'boolean') {
    return true;
  }
  return enumValues?.[0];
}
