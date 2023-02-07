export type CssVariablesObj = Record<string, string>;

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T; // from lodash
