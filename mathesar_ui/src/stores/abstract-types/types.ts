import type { QuerySummarizationFunctionId } from '@mathesar/api/rest/types/queries';
import type { Column } from '@mathesar/api/rest/types/tables/columns';
import type { States } from '@mathesar/api/rest/utils/requestUtils';
import type { DbType } from '@mathesar/AppTypes';
import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
import type {
  FormConfiguration,
  FormConfigurationVariable,
  FormValues,
  IconProps,
} from '@mathesar-component-library/types';

import type { abstractTypeCategory } from './constants';

type AbstractTypeCategoryKeys = keyof typeof abstractTypeCategory;
export type AbstractTypeCategoryIdentifier =
  (typeof abstractTypeCategory)[AbstractTypeCategoryKeys];

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
  hasParams: boolean;
}

export interface AbstractTypeLimitedFilterInformation {
  id: AbstractTypeFilterDefinitionResponse['id'];
  name: AbstractTypeFilterDefinitionResponse['name'];
  hasAliases: boolean;
  hasParams: boolean;
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

export interface AbstractTypeSummarizationFunctionsResponseValue {
  label: string;
  /**
   * - Keys are abstract types to which this summarization function applies.
   * - Values are the abstract types that the summarization function returns.
   */
  inputOutputTypeMap: Partial<
    Record<AbstractTypeCategoryIdentifier, AbstractTypeCategoryIdentifier>
  >;
}

export type AbstractTypeSummarizationFunctionsResponse = Record<
  QuerySummarizationFunctionId,
  AbstractTypeSummarizationFunctionsResponseValue
>;

/**
 * A summarization function for a _specific_ abstract type, showing the return
 * value for that type.
 */
export interface AbstractTypeSummarizationFunction {
  id: QuerySummarizationFunctionId;
  label: AbstractTypeSummarizationFunctionsResponseValue['label'];
  inputType: AbstractTypeCategoryIdentifier;
  outputType: AbstractTypeCategoryIdentifier;
}
