import type { Writable } from 'svelte/store';
import type { DynamicInputType } from '@mathesar-component-library-dir/dynamic-input/types.d';

export type InputDataType = boolean | string | number | undefined;

export type LayoutInputElement = {
  type: 'input',
  variable: string,
  title?: string
};

export type LayoutDividerElement = {
  type: 'divider'
};

export type LayoutElement = LayoutInputElement | LayoutDividerElement;

export interface Layout {
  type?: 'layout',
  orientation: 'vertical' | 'horizonal',
  elements: (LayoutElement | Layout)[],
}

export interface FormConfiguration {
  variables: Record<string, {
    type: DynamicInputType,
    default: InputDataType
  }>,
  layout: Layout
}

export interface FormBuildConfiguration extends FormConfiguration {
  stores: Record<string, Writable<InputDataType>>
}
