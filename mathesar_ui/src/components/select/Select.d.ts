export interface SelectOption {
  [key: string]: unknown
}

export type SelectOptions = SelectOption[] | Promise<SelectOption>;
export interface SelectChangeEvent extends Event {
  detail: {
    value: SelectOption
  }
}
