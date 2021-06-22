export interface SelectOption {
  [key: string]: unknown
}

export type SelectOptions = SelectOption[] | Promise<SelectOption>;
