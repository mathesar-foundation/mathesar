import type {
  FormInputDataType,
  FormValues,
} from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/App';
import type { AbstractTypeConfigForm } from '@mathesar/stores/abstract-types/types';
import type { Column } from '@mathesar/stores/table-data/types';

export function getSavedVariablesFromFormConfig(
  abstractTypeFormConfig: AbstractTypeConfigForm,
): string[] {
  return Object.keys(abstractTypeFormConfig.variables).filter(
    (variableKey) => 'isSaved' in abstractTypeFormConfig.variables[variableKey],
  );
}

export function getDefaultsFromFormConfig(
  abstractTypeFormConfig: AbstractTypeConfigForm,
  selectedDbType: DbType,
  column: Column,
): Record<string, FormInputDataType> {
  const typeOptions = column.type_options ?? {};
  if (column.type === selectedDbType) {
    const defaultValues: FormValues = {};
    Object.keys(abstractTypeFormConfig.variables).forEach(
      (variableKey: string) => {
        const formVariable = abstractTypeFormConfig.variables[variableKey];
        if ('isSaved' in formVariable) {
          defaultValues[variableKey] = typeOptions[variableKey] ?? null;
        } else if (formVariable.defaults[selectedDbType]) {
          defaultValues[variableKey] = formVariable.defaults[selectedDbType];
        }
      },
    );
    return defaultValues;
  }
  return typeOptions;
}
