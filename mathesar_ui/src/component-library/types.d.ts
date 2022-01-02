import type { SvelteComponent } from 'svelte';

export * from './common/utils';

export type Appearance = 'default' | 'primary' | 'secondary' | 'plain' | 'ghost';
export type Size = 'small' | 'medium' | 'large';

export interface Option {
  value: string | number,
  label?: string,
  labelComponent?: typeof SvelteComponent,
  labelComponentProps?: unknown,
  disabled?: boolean,
}

export type { Tab } from './tabs/TabContainer.d';
export type { TreeItem } from './tree/Tree.d';
export * from './icon/Icon.d';
export * from './select/Select.d';
export * from './file-upload/FileUpload.d';
export * from './dynamic-input/types.d';
export * from './form-builder/types.d';
