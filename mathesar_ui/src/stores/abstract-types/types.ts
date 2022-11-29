import type {
  FormConfiguration,
  FormConfigurationVariable,
  FormValues,
  IconProps,
} from '@mathesar-component-library/types';
import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
import type { DbType } from '@mathesar/AppTypes';
import type { Column } from '@mathesar/api/types/tables/columns';
import type { States } from '@mathesar/api/utils/requestUtils';
import type { abstractTypeCategory } from './constants';

type AbstractTypeCategoryKeys = keyof typeof abstractTypeCategory;
export type AbstractTypeCategoryIdentifier =
  typeof abstractTypeCategory[AbstractTypeCategoryKeys];

export interface AbstractTypeResponse {
  name: string;
  identifier: AbstractTypeCategoryIdentifier;
  db_types: DbType[];
}

export interface AbstractTypeConfigFormVariable
  extends FormConfigurationVariable {
  conditionalDefault?: Record<DbType, unknown>;
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

export interface CellInfo {
  type: CellDataType;
  config?: Record<string, unknown>;
  conditionalConfig?: Record<DbType, Record<string, unknown>>;
}

export interface AbstractTypeIconArgs {
  dbType: DbType;
  typeOptions: Column['type_options'];
}

export interface AbstractTypeConfiguration {
  defaultDbType?: DbType;
  getIcon: (args?: AbstractTypeIconArgs) => IconProps | IconProps[];
  allowSettingDefaultValue?: boolean;
  cellInfo: CellInfo;
  getDbConfig?: (selectedDbType?: DbType) => AbstractTypeDbConfig;
  getDisplayConfig?: () => AbstractTypeDisplayConfig;
}

export type AbstractTypeConfigurationPartialMap = Partial<
  Record<AbstractTypeCategoryIdentifier, AbstractTypeConfiguration>
>;

export interface AbstractType
  extends Omit<AbstractTypeResponse, 'db_types'>,
    AbstractTypeConfiguration {
  dbTypes: Set<DbType>;
}

export type AbstractTypesMap = Map<AbstractType['identifier'], AbstractType>;

export type AbstractTypeConfigurationFactory = (
  map: AbstractTypesMap,
) => AbstractTypeConfiguration;

export interface AbstractTypesSubstance {
  state: States;
  data: AbstractTypesMap;
  error?: string;
}

export interface AbstractTypeFilterDefinitionResponse {
  id: string;
  name: string;
  aliases?: Record<AbstractTypeCategoryIdentifier, string>;
  uiTypeParameterMap: Partial<
    Record<AbstractTypeCategoryIdentifier, AbstractTypeCategoryIdentifier[]>
  >;
}

export interface AbstractTypeFilterDefinition {
  id: AbstractTypeFilterDefinitionResponse['id'];
  name: AbstractTypeFilterDefinitionResponse['name']; // Would be extraced from alias if present
  parameters: AbstractTypeCategoryIdentifier[];
}

export type AbstractTypeFilterDefinitionMap = Map<
  AbstractTypeCategoryIdentifier,
  AbstractTypeFilterDefinition[]
>;

export interface AbstractTypePreprocFunctionsResponse {
  id: string;
  name: string;
  appliesTo: AbstractTypeCategoryIdentifier[];
  returns: AbstractTypeCategoryIdentifier;
  possibleReturnValues?: { label: string; value: unknown }[];
}

export type AbstractTypePreprocFunctionDefinition = Omit<
  AbstractTypePreprocFunctionsResponse,
  'appliesTo'
>;

export type AbstractTypePreprocFunctionDefinitionMap = Map<
  AbstractTypeCategoryIdentifier,
  AbstractTypePreprocFunctionDefinition[]
>;
