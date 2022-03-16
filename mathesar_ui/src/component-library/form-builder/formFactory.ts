import { derived, get, writable } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import type {
  FormInputDataType,
  FormConfiguration,
  FormBuildConfiguration,
  FormValues,
  FormValidationResult,
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

  const storeUsage: Writable<Map<string, number>> = writable(
    new Map() as Map<string, number>,
  );

  const values: Readable<Record<string, FormInputDataType>> = derived(
    [storeUsage, ...stores.values()],
    ([storeUsageValues, ...storeValues]) => {
      const valueObj: Record<string, FormInputDataType> = {};
      [...stores.keys()].forEach((key, index) => {
        const usageCount = storeUsageValues.get(key);
        if (typeof usageCount !== 'undefined' && usageCount > 0) {
          valueObj[key] = storeValues[index];
        }
      });
      return valueObj;
    },
  );

  function getValues(): ReturnType<FormBuildConfiguration['getValues']> {
    return get(values);
  }

  const validation: Readable<FormValidationResult> = derived(
    values,
    ($values) => {
      const validationObj: FormValidationResult = {
        isValid: true,
        failedChecks: {},
      };
      Object.keys($values).forEach((variableName) => {
        const storedValue = $values[variableName];
        const variableInfo = formConfig.variables[variableName];
        const validationRules = variableInfo?.validation;
        if (variableInfo && validationRules) {
          const { checks } = validationRules;
          if (checks.includes('isEmpty')) {
            let isValid =
              typeof storedValue !== 'undefined' && storedValue !== null;
            if (variableInfo.type === 'string') {
              isValid = isValid && storedValue !== '';
            }
            if (!isValid) {
              if (!validationObj.failedChecks[variableName]) {
                validationObj.failedChecks[variableName] = [];
              }
              validationObj.failedChecks[variableName].push('isEmpty');
            }
            validationObj.isValid = validationObj.isValid && isValid;
          }
        }
      });
      return validationObj;
    },
  );

  function getValidationResult(): FormValidationResult {
    return get(validation);
  }

  return {
    ...formConfig,
    stores,
    storeUsage,
    values,
    validation,
    getValidationResult,
    getValues,
  };
}
