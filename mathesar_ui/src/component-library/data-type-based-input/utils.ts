import type {
  DataTypeBasedInputType,
  DataTypeBasedInputSelectElement,
  EnumSelectOption,
} from './types';

export function generateSelectOptions(
  dataType: DataTypeBasedInputType,
  enumValues?: unknown[],
  options?: DataTypeBasedInputSelectElement['options'],
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
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    enumValues?.map((value: string) => ({
      value,
      label: options?.[value]?.label ?? value,
    })) || []
  );
}

export function getSelectedValue(
  options: EnumSelectOption[],
  value: unknown,
): EnumSelectOption | undefined {
  return options.find((elem) => elem.value === value);
}

export function getInitialValue(
  dataType: DataTypeBasedInputType,
  enumValues?: unknown[],
): unknown {
  if (dataType === 'boolean') {
    return true;
  }
  return enumValues?.[0];
}
