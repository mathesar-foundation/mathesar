import type { FormInputDataType } from '@mathesar-component-library/types';
import type { AbstractTypeConfigForm } from '@mathesar/stores/abstract-types/types';

export function getDefaultsAndSavedVarsFromFormConfig(
  abstractTypeFormConfig: AbstractTypeConfigForm,
): [Record<string, Record<string, FormInputDataType>>, string[]] {
  const savedVariables: string[] = [];
  const defaults: Record<string, Record<string, FormInputDataType>> = {};

  Object.keys(abstractTypeFormConfig.variables).forEach((variableKey) => {
    const formVariable = abstractTypeFormConfig.variables[variableKey];
    if ('isSaved' in formVariable) {
      savedVariables.push(variableKey);
    } else if (formVariable.defaults) {
      Object.keys(formVariable.defaults).forEach((dbTypeKey) => {
        if (!defaults[dbTypeKey]) {
          defaults[dbTypeKey] = {};
        }
        defaults[dbTypeKey][variableKey] = formVariable.defaults[dbTypeKey];
      });
    }
  });

  return [defaults, savedVariables];
}
