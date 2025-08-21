import { type HTMLInputAttributes } from 'svelte/elements';

export type Appearance =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'plain'
  | 'ghost'
  | 'plain-primary'
  | 'action'
  | 'outcome'
  | 'outline-primary'
  | 'outline-danger'
  | 'inspector'
  | 'feedback'
  | 'custom'
  | 'link';

export type Size = 'small' | 'medium' | 'large';

type InputProps = HTMLInputAttributes;
export type SimplifiedInputProps = Omit<InputProps, 'disabled' | 'id'>;
export type CssVariablesObj = Record<string, string>;
