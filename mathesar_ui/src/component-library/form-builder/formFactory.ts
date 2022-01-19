import { derived, get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type {
  FormInputDataType,
  FormConfiguration,
  FormBuildConfiguration,
} from './types';

export function makeForm(
  formConfig: FormConfiguration,
): FormBuildConfiguration {
  const stores: FormBuildConfiguration['stores'] = new Map();
  Object.keys(formConfig.variables)?.forEach((key) => {
    stores.set(key, writable(formConfig.variables[key].default));
  });

  const values: Readable<Record<string, FormInputDataType>> = derived(
    [...stores.values()],
    (storeValues) => {
      const valueObj = {};
      [...stores.keys()].forEach((key, index) => {
        valueObj[key] = storeValues[index];
      });
      return valueObj;
    },
  );

  function getValues(): ReturnType<FormBuildConfiguration['getValues']> {
    return get(values);
  }

  return {
    ...formConfig,
    stores,
    values,
    getValues,
  };
}
