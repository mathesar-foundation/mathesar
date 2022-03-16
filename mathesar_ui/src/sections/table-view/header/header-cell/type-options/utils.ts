import type {
  FormInputDataType,
  FormValues,
} from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/App';
import type { AbstractTypeDbConfigOptions } from '@mathesar/stores/abstract-types/types';
import type { Column } from '@mathesar/stores/table-data/types';

export function getDefaultValuesFromConfig(
  abstractTypeConfig: AbstractTypeDbConfigOptions['configuration'],
  selectedDbType: DbType,
  column: Column,
): Record<string, FormInputDataType> {
  const abstractTypeFormConfig = abstractTypeConfig.form;
  const typeOptions = column.type_options ?? {};
  if (column.type === selectedDbType) {
    const defaultValues: FormValues = {};
    const savableVariables =
      abstractTypeConfig.getSavableTypeOptions(selectedDbType);
    Object.keys(abstractTypeFormConfig.variables).forEach(
      (variableKey: string) => {
        const formVariable = abstractTypeFormConfig.variables[variableKey];
        if (savableVariables.includes(variableKey)) {
          defaultValues[variableKey] = typeOptions[variableKey] ?? null;
        } else if (
          typeof formVariable.conditionalDefault?.[selectedDbType] !==
          'undefined'
        ) {
          defaultValues[variableKey] =
            formVariable.conditionalDefault[selectedDbType];
        }
      },
    );
    return defaultValues;
  }
  return typeOptions;
}
