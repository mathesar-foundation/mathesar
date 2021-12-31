import type { Writable } from 'svelte/store';
import type { DynamicInputType } from '@mathesar-component-library-dir/dynamic-input/types.d';

export type FormInputDataType = boolean | string | number | undefined;

export interface FormInputBaseElement {
  type: 'input',
  inputType?: string,
  variable: string,
  label?: string,
}

export interface FormInputSelectElement extends FormInputBaseElement {
  inputType: 'select',
  options: Record<string, {
    label?: string,
  }>
}

export type FormInputElement = FormInputBaseElement | FormInputSelectElement;

export type ConditionalSwitchElement = {
  type: 'switch',
  switch: string,
  cases: Record<string, FormElement[]>
};

export type ConditionalIfElement = {
  type: 'if',
  if: string,
  condition: 'eq' | 'neq',
  value: unknown,
  elements: FormElement[]
};

export type ConditionalElement = ConditionalSwitchElement | ConditionalIfElement;

export type FormElement = FormInputElement
| ConditionalElement
| FormLayout;

export interface FormLayout {
  type?: 'layout',
  orientation: 'vertical' | 'horizontal',
  elements: FormElement[],
}

export interface FormConfiguration {
  variables: Record<string, {
    type: DynamicInputType,
    default: FormInputDataType,
    enum?: unknown[]
  }>,
  layout: FormLayout
}

export type FormInputStore = Writable<FormInputDataType>;

export interface FormBuildConfiguration extends FormConfiguration {
  stores: Record<string, FormInputStore>
}
