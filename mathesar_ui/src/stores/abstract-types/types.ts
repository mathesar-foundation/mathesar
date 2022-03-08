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

interface AbstractTypeConfigFormSavedVariable
  extends FormConfigurationVariable {
  isSaved: true;
}

interface AbstractTypeConfigFormUnSavedVariable
  extends FormConfigurationVariable {
  defaults: Record<DbType, FormInputDataType>;
}

export type AbstractTypeConfigFormVariable =
  | AbstractTypeConfigFormSavedVariable
  | AbstractTypeConfigFormUnSavedVariable;

export interface AbstractTypeConfigForm extends FormConfiguration {
  variables: Record<string, AbstractTypeConfigFormVariable>;
}

export interface AbstractTypeDbConfigOptions {
  allowDefault: boolean;
  configuration: {
    form: AbstractTypeConfigForm;
    determineDbType: (
      formValues: FormValues,
      columnType: DbType,
      typeOptions: Column['type_options'],
    ) => DbType;
  };
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
    database: AbstractTypeDbConfigOptions;
    display?: {
      form: AbstractTypeConfigForm;
    };
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
