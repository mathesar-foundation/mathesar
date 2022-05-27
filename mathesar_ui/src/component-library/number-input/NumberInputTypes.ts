import type { FormattedInputProps } from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import type { NumberFormatterOptions } from './number-formatter/types';

export * from './number-formatter/types';

export interface NumberInputProps extends Partial<NumberFormatterOptions> {
  value?: number;
  element?: HTMLInputElement;
}

export interface StringifiedNumberInputProps
  extends Partial<NumberFormatterOptions>,
    Omit<FormattedInputProps<string>, 'formatter'> {
  value?: string | null;
  element?: HTMLInputElement;
}
