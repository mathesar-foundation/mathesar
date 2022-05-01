import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { SimplifiedInputProps } from '@mathesar-component-library-dir/commonTypes';

export interface TextInputProps extends SimplifiedInputProps, BaseInputProps {
  value?: string | null;
  class?: string;
  element?: HTMLInputElement;
  hasError?: boolean;
}
