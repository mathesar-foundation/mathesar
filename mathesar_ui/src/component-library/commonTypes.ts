export type Appearance =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'plain'
  | 'ghost'
  | 'plain-primary';

export type Size = 'small' | 'medium' | 'large';

type InputProps = svelte.JSX.HTMLAttributes<HTMLInputElement>;
export type SimplifiedInputProps = Omit<InputProps, 'disabled' | 'id'>;
