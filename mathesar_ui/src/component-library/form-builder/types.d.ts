import type { Writable } from 'svelte/store';
import type { DynamicInputType } from '@mathesar-component-library-dir/dynamic-input/types.d';

export type InputDataType = boolean | string | number | undefined;

export interface LayoutInputBaseElement {
  type: 'input',
  inputType?: string,
  variable: string,
  label?: string,
}

export interface LayoutInputSelectElement extends LayoutInputBaseElement {
  inputType: 'select',
  options: Record<string, {
    label?: string,
  }>
}

export type LayoutInputElement = LayoutInputBaseElement | LayoutInputSelectElement;

export type LayoutDividerElement = {
  type: 'divider'
};

export type LayoutConditionalSwitchElement = {
  type: 'switch',
  switch: string,
  cases: Record<string, LayoutElement[]>
};

export type LayoutConditionalIfElement = {
  type: 'if',
  if: string,
  condition: 'eq' | 'neq',
  value: unknown,
  elements: LayoutElement[]
};

export type LayoutConditionalElement = LayoutConditionalSwitchElement | LayoutConditionalIfElement;

export type LayoutElement = LayoutInputElement
| LayoutDividerElement
| LayoutConditionalElement
| Layout;

export interface Layout {
  type?: 'layout',
  orientation: 'vertical' | 'horizontal',
  elements: LayoutElement[],
}

export interface FormConfiguration {
  variables: Record<string, {
    type: DynamicInputType,
    default: InputDataType,
    enum?: unknown[]
  }>,
  layout: Layout
}

export interface FormBuildConfiguration extends FormConfiguration {
  stores: Record<string, Writable<InputDataType>>
}
