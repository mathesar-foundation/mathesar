import type { HTMLInputAttributes } from 'svelte/elements';

import type { BaseInputProps } from '@mathesar-component-library-dir/common/base-components/BaseInputTypes';
import type { CssVariablesObj } from '@mathesar-component-library-dir/commonTypes';

import type { IconProps } from '../types';

export interface TextInputProps
  extends Omit<HTMLInputAttributes, 'id' | 'disabled'>,
    BaseInputProps {
  value?: string | null;
  element?: HTMLInputElement;
  hasError?: boolean;
  cssVariables?: CssVariablesObj;
}

export type SimplifiedTextInputProps = Omit<TextInputProps, 'value'>;

export type TextInputWithPrefixProps = TextInputProps & {
  prefixIcon: IconProps;
};
