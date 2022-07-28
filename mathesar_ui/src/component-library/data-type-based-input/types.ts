export type DataTypeBasedInputType =
  | 'boolean'
  | 'integer'
  | 'float'
  | 'string'
  | 'date'
  | 'datetime'
  | 'time';

export type DataTypeBasedInputInterface =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'toggle'
  | 'select';

export interface DataTypeBasedInputSelectElement {
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
