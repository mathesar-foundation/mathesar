import type { SvelteComponent } from 'svelte';

export interface CellComponentAndProps<T> {
  component: typeof SvelteComponent;
  props?: T;
}

export interface CellTypeProps {
  value: unknown;
  isActive: boolean;
  disabled: boolean;
}

// TextBox

export interface TextBoxCellExternalProps {
  length?: number | null;
}

export interface TextBoxCellProps
  extends CellTypeProps,
    TextBoxCellExternalProps {
  value: string | null | undefined;
}

// TextArea

export type TextAreaCellExternalProps = TextBoxCellExternalProps;

export type TextAreaCellProps = TextBoxCellProps;

// Checkbox

export type CheckBoxCellExternalProps = Record<string, never>;

export interface CheckBoxCellProps extends CellTypeProps {
  value: boolean | null | undefined;
}

// SingleSelect

export interface SingleSelectCellExternalProps<
  ValueType,
  OptionType = ValueType,
> {
  options: OptionType[];
  getSelectedOptionsFromValue: (
    value: ValueType | null | undefined,
  ) => OptionType[];
  getValueFromSelectedOptions: (options: OptionType[]) => ValueType | null;
  getValueLabel?: (value: ValueType) => string;
}

export interface SingleSelectCellProps<ValueType, OptionType = ValueType>
  extends CellTypeProps,
    SingleSelectCellExternalProps<ValueType, OptionType> {
  value: ValueType | null | undefined;
}
