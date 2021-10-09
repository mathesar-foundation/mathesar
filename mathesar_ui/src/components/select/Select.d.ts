export interface SelectOption<T = unknown> {
  [key: string]: T
}

export type SelectOptions<T = unknown> = SelectOption<T>[] | Promise<SelectOption<T>>;
export interface SelectChangeEvent<T = unknown> extends Event {
  detail: {
    value: SelectOption<T>
  }
}
