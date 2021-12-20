import type { SelectOption } from '@mathesar-component-library-dir/select/Select.d';

export type DynamicInputType =
  'boolean' | 'integer' | 'float' | 'string' | 'date' | 'datetime' | 'time';

export type DynamicInputElementType =
  'text' | 'textarea' | 'number' | 'checkbox' | 'toggle' | 'select';

export interface DynamicInputSelectElement {
  inputType: 'select',
  options: Record<string, {
    label?: string,
  }>
}

export interface EnumSelectOption extends SelectOption<unknown> {
  value: unknown,
  label: string
}
