import type {
  FormattedInputProps,
  SelectProps,
  StringifiedNumberInputProps,
} from '@mathesar-component-library/types';

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
  locale?: string;
  allowFloat: boolean;
  useGrouping: StringifiedNumberInputProps['useGrouping'];
}

export interface NumberCellProps
  extends CellTypeProps<string | number>,
    NumberCellExternalProps {}

// Checkbox

export type CheckBoxCellExternalProps = Record<string, never>;

export type CheckBoxCellProps = CellTypeProps<boolean>;

// SingleSelect

export type SingleSelectCellExternalProps<Option> = Pick<
  SelectProps<Option>,
  'options' | 'getLabel'
>;

export interface SingleSelectCellProps<Option>
  extends CellTypeProps<Option>,
    SingleSelectCellExternalProps<Option> {}

// Duration

export type FormattedInputCellExternalProps = Omit<
  FormattedInputProps<string>,
  'disabled' | 'value'
>;

export interface FormattedInputCellProps
  extends CellTypeProps<string>,
    FormattedInputCellExternalProps {}

export type HorizontalAlignment = 'left' | 'right' | 'center';
