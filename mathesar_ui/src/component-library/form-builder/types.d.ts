import type { Writable } from 'svelte/store';
import type { DynamicInputDataType } from '@mathesar-component-library-dir/dynamic-input/types.d';

export type FormInputDataType = boolean | string | number | undefined;

export interface FormInputBaseElement {
  type: 'input';
  interfaceType?: string;
  variable: string;
  label?: string;
}

export interface FormInputSelectElement extends FormInputBaseElement {
  interfaceType: 'select';
  options: Record<
    string,
    {
      label?: string;
    }
  >;
}

export type FormInputElement = FormInputBaseElement | FormInputSelectElement;

export type ConditionalSwitchElement = {
  type: 'switch';
  variable: string;
  cases: Record<string, FormElement[]>;
};

export type ConditionalIfElement = {
  type: 'if';
  variable: string;
  condition: 'eq' | 'neq';
  value: unknown;
  elements: FormElement[];
};

export type ConditionalElement =
  | ConditionalSwitchElement
  | ConditionalIfElement;

export type FormElement = FormInputElement | ConditionalElement | FormLayout;

export interface FormLayout {
  type?: 'layout';
  orientation: 'vertical' | 'horizontal';
  elements: FormElement[];
}

export interface FormConfigurationVariable {
  type: DynamicInputDataType;
  default?: FormInputDataType;
  enum?: unknown[];
}

export type FormConfigurationVariables = Record<
  string,
  FormConfigurationVariable
>;

export interface FormConfiguration {
  variables: FormConfigurationVariables;
  layout: FormLayout;
}

export type FormInputStore = Writable<FormInputDataType>;

export type FormValues = Record<string, FormInputDataType>;

export interface FormBuildConfiguration extends FormConfiguration {
  stores: Map<string, FormInputStore>;
  values: Readable<FormValues>;
  storeUsage: Writable<Map<string, number>>;
  getValues: () => Record<string, FormInputDataType>;
}
