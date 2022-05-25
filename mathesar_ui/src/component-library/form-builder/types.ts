import type { SvelteComponent } from 'svelte';
import type { Readable, Writable } from 'svelte/store';
import type { DynamicInputDataType } from '@mathesar-component-library-dir/dynamic-input/types';

export interface FormInputBaseElement {
  type: 'input';
  interfaceType?: string;
  variable: string;
  label?: string;
  // TODO: Support customizable text (eg., errors, info etc.,)
  text?: {
    validation?: {
      isEmpty?: string;
      isInvalid?: string;
    };
  };
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

export interface FormStaticElement {
  type: 'static';
  variable: string;
  componentId: string;
  props?: Record<string, unknown>;
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

export type FormElement =
  | FormInputElement
  | ConditionalElement
  | FormLayout
  | FormStaticElement;

export interface FormLayout {
  type?: 'layout';
  orientation: 'vertical' | 'horizontal';
  elements: FormElement[];
}

export type FormValidationCheck = 'isEmpty' | 'isInvalid';

export interface FormConfigurationVariable {
  type: DynamicInputDataType | 'custom';
  default?: unknown;
  enum?: unknown[];
  validation?: {
    checks: FormValidationCheck[];
  };
}

export type FormConfigurationVariables = Record<
  string,
  FormConfigurationVariable
>;

export interface FormConfiguration {
  variables: FormConfigurationVariables;
  layout: FormLayout;
}

export type FormValueStore = Writable<unknown>;

export type FormValues = Record<string, unknown>;

export interface FormValidationResult {
  isValid: boolean;
  failedChecks: Record<string, FormValidationCheck[]>;
}

export interface FormBuildConfiguration extends FormConfiguration {
  stores: Map<string, FormValueStore>;
  values: Readable<FormValues>;
  validationStore: Readable<FormValidationResult>;
  getValidationResult: () => FormValidationResult;
  customComponents?: Record<string, typeof SvelteComponent>;
}
