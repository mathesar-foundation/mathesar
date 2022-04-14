export type DynamicInputDataType =
  | 'boolean'
  | 'integer'
  | 'float'
  | 'string'
  | 'date'
  | 'datetime'
  | 'time';

export type DynamicInputInterfaceType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'toggle'
  | 'select';

export interface DynamicInputSelectElement {
  interfaceType: 'select';
  options?: Record<
    string,
    {
      label?: string;
    }
  >;
}

export interface EnumSelectOption {
  value: unknown;
  label: string;
}
