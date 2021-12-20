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
