import type {
  FormConfiguration,
  FormConfigurationVariable,
  FormInputDataType,
  FormValues,
} from '@mathesar-component-library/types';
import type { CellDataType } from '@mathesar/components/cell/data-types/typeDefinitions';
import type { DbType } from '@mathesar/AppTypes';
import type { Column } from '@mathesar/stores/table-data/types';
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

export interface AbstractTypeDbConfig {
  form: AbstractTypeConfigForm;
  determineDbTypeAndOptions: (
    dbFormValues: FormValues,
    columnType: DbType,
  ) => {
    dbType: DbType;
    typeOptions: Column['type_options'];
  };
  constructDbFormValuesFromTypeOptions: (
    columnType: DbType,
    typeOptions: Column['type_options'],
  ) => FormValues;
}

export interface AbstractTypeDisplayConfig {
  form: AbstractTypeConfigForm;
  determineDisplayOptions: (
    dbFormValues: FormValues,
  ) => Column['display_options'];
  constructDisplayFormValuesFromDisplayOptions: (
    displayOptions: Column['display_options'],
  ) => FormValues;
}

export interface AbstractTypeConfiguration {
  defaultDbType?: DbType;
  icon: string;
  allowSettingDefaultValue?: boolean;
  cell: {
    type: CellDataType;
    config?: Record<string, unknown>;
    conditionalConfig?: Record<DbType, Record<string, unknown>>;
  };
  getDbConfig?: (selectedDbType?: DbType) => AbstractTypeDbConfig;
  getDisplayConfig?: () => AbstractTypeDisplayConfig;
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
