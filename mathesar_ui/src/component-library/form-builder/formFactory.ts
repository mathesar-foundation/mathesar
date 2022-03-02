import { derived, get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type {
  FormInputDataType,
  FormConfiguration,
  FormBuildConfiguration,
  FormValues,
} from './types';

export function makeForm(
  formConfig: FormConfiguration,
  formValues?: FormValues,
): FormBuildConfiguration {
  const stores: FormBuildConfiguration['stores'] = new Map();
  Object.keys(formConfig.variables)?.forEach((key) => {
    const value =
      typeof formValues?.[key] !== 'undefined'
        ? formValues[key]
        : formConfig.variables[key].default;
    stores.set(key, writable(value));
  });

  const storeUsage = writable(new Map());

  const values: Readable<Record<string, FormInputDataType>> = derived(
    [storeUsage, ...stores.values()],
    ([storeUsageValues, ...storeValues]) => {
      const valueObj: Record<string, FormInputDataType> = {};
      [...stores.keys()].forEach((key, index) => {
        if (storeUsageValues.get(key) > 0) {
          valueObj[key] = storeValues[index];
        }
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
    storeUsage,
    values,
    getValues,
  };
}
