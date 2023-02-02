import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { SimplifiedInputProps } from '@mathesar-component-library-dir/commonTypes';
import type { CssVariablesObj } from '@mathesar/types';
import type { IconProps } from '../types';

export interface TextInputProps extends SimplifiedInputProps, BaseInputProps {
  value?: string | null;
  element?: HTMLInputElement;
  hasError?: boolean;
  cssVariables?: CssVariablesObj;
}

export type SimplifiedTextInputProps = Omit<TextInputProps, 'value'>;

export type TextInputWithPrefixProps = TextInputProps & {
  prefixIcon: IconProps;
};
