import type { SvelteComponent } from 'svelte';

export * from './common/utils';

export type Appearance =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'plain'
  | 'ghost';
export type Size = 'small' | 'medium' | 'large';

export interface Option {
  value: string | number;
  label?: string;
  labelComponent?: typeof SvelteComponent;
  labelComponentProps?: unknown;
  disabled?: boolean;
}

export type { Tab } from './tabs/TabContainerTypes';
export type { TreeItem } from './tree/TreeTypes';
export type { ComponentAndProps } from './common/types/ComponentAndPropsTypes';
export * from './icon/IconTypes';
export * from './file-upload/FileUploadTypes';
export * from './dynamic-input/types';
export * from './form-builder/types';
export * from './cancel-or-proceed-button-pair/CancelOrProceedButtonPairTypes';
export * from './listbox/ListBoxTypes';
