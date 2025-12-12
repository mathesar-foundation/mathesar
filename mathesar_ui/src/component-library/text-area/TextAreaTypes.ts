import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { SimplifiedInputProps } from '@mathesar-component-library-dir/commonTypes';

export interface TextAreaProps extends SimplifiedInputProps, BaseInputProps {
  value?: string | null;
  element?: HTMLTextAreaElement;
  addNewLineOnEnterKeyCombinations?: boolean;
}

export interface TextAreaProcessedKeyDown {
  type: 'normal' | 'newlineWithEnterKeyCombination';
  originalEvent: KeyboardEvent;
}
