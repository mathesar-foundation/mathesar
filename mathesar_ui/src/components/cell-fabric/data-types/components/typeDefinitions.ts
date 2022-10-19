import type {
  FormattedInputProps,
  NumberFormatterOptions,
  SelectProps,
} from '@mathesar-component-library/types';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { DateTimeFormatter } from '@mathesar/utils/date-time/types';

export interface CellTypeProps<Value> {
  value: Value | null | undefined;
  isActive: boolean;
  isSelectedInRange: boolean;
  disabled: boolean;
}

// Primary key

export type PrimaryKeyCellValue = string | number;

export interface PrimaryKeyCellExternalProps {
  tableId: DBObjectEntry['id'];
}

export interface PrimaryKeyCellProps
  extends CellTypeProps<ForeignKeyCellValue>,
    LinkedRecordCellExternalProps {}

// Foreign key

export type ForeignKeyCellValue = string | number | null;

export interface LinkedRecordCellExternalProps {
  tableId: DBObjectEntry['id'];
}

export interface LinkedRecordCellProps
  extends CellTypeProps<ForeignKeyCellValue>,
    LinkedRecordCellExternalProps {
  recordSummary?: string;
  setRecordSummary?: (recordId: string, recordSummary: string) => void;
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

export type NumberCellExternalProps = Partial<NumberFormatterOptions>;

export interface NumberCellProps
  extends CellTypeProps<string | number>,
    NumberCellExternalProps {}

// Money

export interface MoneyCellExternalProps
  extends Partial<NumberFormatterOptions> {
  currencySymbol: string;
  currencySymbolLocation: 'after-minus' | 'end-with-space';
}

export interface MoneyCellProps
  extends CellTypeProps<string | number>,
    MoneyCellExternalProps {}

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

// FormattedInput

export type FormattedInputCellExternalProps = Omit<
  FormattedInputProps<string>,
  'disabled' | 'value'
>;

export interface FormattedInputCellProps
  extends CellTypeProps<string>,
    FormattedInputCellExternalProps {}

// DateInput

export interface DateTimeCellExternalProps {
  type: 'date' | 'time' | 'datetime';
  formattingString: string;
  formatter: DateTimeFormatter;
  timeShow24Hr?: boolean;
  timeEnableSeconds?: boolean;
  allowRelativePresets?: boolean;
}

export interface DateTimeCellProps
  extends CellTypeProps<string>,
    DateTimeCellExternalProps {}

// Common

export type HorizontalAlignment = 'left' | 'right' | 'center';
