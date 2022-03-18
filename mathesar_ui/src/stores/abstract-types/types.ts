import type {
  FormConfiguration,
  FormConfigurationVariable,
  FormInputDataType,
  FormValues,
} from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/App.d';
import type { Column } from '@mathesar/stores/table-data/types.d';
import type { States } from '@mathesar/utils/api';

export interface AbstractTypeResponse {
  name: string;
  identifier: string;
  db_types: DbType[];
}

interface AbstractTypeConfigFormVariable extends FormConfigurationVariable {
  conditionalDefault?: Record<DbType, FormInputDataType>;
}
export interface AbstractTypeConfigForm extends FormConfiguration {
  variables: Record<string, AbstractTypeConfigFormVariable>;
}

export interface AbstractTypeDbConfigOptions {
  allowDefault: boolean;
  // TODO: Check if encapsulation within configuration is needed for it's properties
  configuration: {
    form: AbstractTypeConfigForm;
    determineDbType: (
      formValues: FormValues,
      columnType: DbType,
      typeOptions: Column['type_options'],
    ) => DbType;
    getSavableTypeOptions: (columnType: DbType) => string[];
  };
}

export interface AbstractTypeDisplayConfigOptions {
  form: AbstractTypeConfigForm;
}

export interface AbstractTypeConfiguration {
  defaultDbType?: DbType;
  icon: string;
  input: {
    type: string;
    config?: Record<string, unknown>;
    conditionalConfig?: Record<DbType, Record<string, unknown>>;
  };
  typeSwitchOptions?: {
    database?: AbstractTypeDbConfigOptions;
    display?: AbstractTypeDisplayConfigOptions;
  };
}

export interface AbstractType
  extends Omit<AbstractTypeResponse, 'db_types'>,
    AbstractTypeConfiguration {
  dbTypes: Set<DbType>;
}

export type AbstractTypesMap = Map<AbstractType['identifier'], AbstractType>;

export interface AbstractTypesSubstance {
  state: States;
  data: AbstractTypesMap;
  error?: string;
}
