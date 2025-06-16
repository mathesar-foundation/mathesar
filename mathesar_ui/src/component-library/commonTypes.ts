export type Appearance =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'plain'
  | 'ghost'
  | 'action'
  | 'outcome'
  | 'tip'
  | 'danger'
  | 'inspector'
  | 'feedback'
  | 'custom'
  | 'link';

export type Size = 'small' | 'medium' | 'large';

type InputProps = svelte.JSX.HTMLAttributes<HTMLInputElement>;
export type SimplifiedInputProps = Omit<InputProps, 'disabled' | 'id'>;
export type CssVariablesObj = Record<string, string>;
