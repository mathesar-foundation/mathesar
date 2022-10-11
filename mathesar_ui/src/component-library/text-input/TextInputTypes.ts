import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { SimplifiedInputProps } from '@mathesar-component-library-dir/commonTypes';
import type { IconProps } from '../types';

export interface TextInputProps extends SimplifiedInputProps, BaseInputProps {
  value?: string | null;
  element?: HTMLInputElement;
  hasError?: boolean;
  prefixIcon?: IconProps;
}

export type SimplifiedTextInputProps = Omit<TextInputProps, 'value'>;

export type BaseTextInputProps = Omit<TextInputProps, 'prefixIcon'>;
