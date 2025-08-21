import type { HTMLTextareaAttributes } from 'svelte/elements';

import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';

export interface TextAreaProps
  extends Omit<HTMLTextareaAttributes, 'id' | 'disabled'>,
    BaseInputProps {
  value?: string | null;
  element?: HTMLTextAreaElement;
  addNewLineOnEnterKeyCombinations?: boolean;
}

export interface TextAreaProcessedKeyDown {
  type: 'normal' | 'newlineWithEnterKeyCombination';
  originalEvent: KeyboardEvent;
}
