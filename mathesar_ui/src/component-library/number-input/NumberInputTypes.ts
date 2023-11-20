import type { FormattedInputProps } from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import type { SimplifiedTextInputProps } from '@mathesar-component-library-dir/text-input/TextInputTypes';
import type { NumberFormatterOptions } from './number-formatter/types';

export * from './number-formatter/types';

export interface NumberInputProps
  extends Partial<NumberFormatterOptions>,
    SimplifiedTextInputProps {
  value?: number | string | null; // Allow both number and string values
  element?: HTMLInputElement;
}

export interface StringifiedNumberInputProps
  extends Partial<NumberFormatterOptions>,
    Omit<FormattedInputProps<string>, 'formatter'> {
  value?: string | null;
  element?: HTMLInputElement;
}
