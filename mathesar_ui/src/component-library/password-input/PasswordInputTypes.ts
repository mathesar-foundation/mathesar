import type { HTMLInputAttributes } from 'svelte/elements';

import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';

export interface PasswordInputProps
  extends Omit<HTMLInputAttributes, 'id' | 'disabled'>,
    BaseInputProps {
  value?: string | null;
  element?: HTMLInputElement;
  hasError?: boolean;
}
