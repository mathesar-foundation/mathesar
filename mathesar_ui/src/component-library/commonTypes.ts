/**
 * Defines the visual appearance of a component.
 *
 * - `control`: Used for general UI controls and action buttons.
 * - `input`: Used for input triggers, mimicking the appearance of form inputs.
 */
export type Appearance =
  | 'control'
  | 'input'
  | 'primary'
  | 'secondary'
  | 'plain'
  | 'ghost'
  | 'action'
  | 'outcome'
  | 'danger'
  | 'link'
  | 'custom'
  | 'tip';

export type Size = 'small' | 'medium' | 'large';

type InputProps = svelte.JSX.HTMLAttributes<HTMLInputElement>;
export type SimplifiedInputProps = Omit<InputProps, 'disabled' | 'id'>;
export type CssVariablesObj = Record<string, string>;
