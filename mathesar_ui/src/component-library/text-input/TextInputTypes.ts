import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { SimplifiedInputProps } from '@mathesar-component-library-dir/commonTypes';

export interface TextInputProps extends SimplifiedInputProps, BaseInputProps {
  value?: string | null;
  element?: HTMLInputElement;
  hasError?: boolean;
}

export type SimplifiedTextInputProps = Omit<TextInputProps, 'value'>;
