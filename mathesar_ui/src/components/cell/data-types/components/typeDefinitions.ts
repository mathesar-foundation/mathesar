import type { SvelteComponent } from 'svelte';

export interface CellComponentAndProps<T> {
  component: typeof SvelteComponent;
  props?: T;
}

export interface CellTypeProps<Value> {
  value: Value | null | undefined;
  isActive: boolean;
  disabled: boolean;
}

// TextBox

export interface TextBoxCellExternalProps {
  length?: number | null;
}

export interface TextBoxCellProps
  extends CellTypeProps<string>,
    TextBoxCellExternalProps {}

// TextArea

export type TextAreaCellExternalProps = TextBoxCellExternalProps;

export type TextAreaCellProps = TextBoxCellProps;

// Number

export interface NumberCellExternalProps {
  format: 'english' | 'german' | 'french' | 'hindi' | 'swiss' | null;
  isPercentage: boolean;
}

export interface NumberCellProps
  extends CellTypeProps<string | number>,
    NumberCellExternalProps {}

// Checkbox

export type CheckBoxCellExternalProps = Record<string, never>;

export type CheckBoxCellProps = CellTypeProps<boolean>;

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
  extends CellTypeProps<ValueType>,
    SingleSelectCellExternalProps<ValueType, OptionType> {}
