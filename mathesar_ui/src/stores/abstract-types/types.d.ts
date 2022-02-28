import type {
  FormConfiguration,
  FormConfigurationVariable,
  FormInputDataType,
  Rule,
} from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/App.d';

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
    determinationRules: {
      resolve: string;
      rule: Rule;
    }[];
  };
}

export interface AbstractTypeConfiguration {
  defaultDbType?: DbType;
  icon: string;
  input: {
    type: string;
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
