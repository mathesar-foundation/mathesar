import type {
  DynamicInputDataType,
  DynamicInputSelectElement,
  EnumSelectOption,
} from './types';

export function generateSelectOptions(
  dataType: DynamicInputDataType,
  enumValues?: unknown[],
  options?: DynamicInputSelectElement['options'],
): EnumSelectOption[] {
  if (dataType === 'boolean') {
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
  return (
    enumValues?.map((value: string) => ({
      value,
      label: options?.[value]?.label ?? value,
    })) || []
  );
}

export function getSelectedValue(
  options: EnumSelectOption[],
  value: unknown,
): EnumSelectOption {
  return options.find((elem) => elem.value === value);
}

export function getInitialValue(
  dataType: DynamicInputDataType,
  enumValues?: unknown[],
): unknown {
  if (dataType === 'boolean') {
    return true;
  }
  return enumValues?.[0];
}
