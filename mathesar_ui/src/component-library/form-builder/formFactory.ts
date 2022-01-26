import { writable } from 'svelte/store';
import type { FormConfiguration, FormBuildConfiguration } from './types';

export function makeForm(
  formConfig: FormConfiguration,
): FormBuildConfiguration {
  const stores = {};
  Object.keys(formConfig.variables)?.forEach((key) => {
    stores[key] = writable(formConfig.variables[key].default);
  });
  return {
    ...formConfig,
    stores,
  };
}
