import type { QuerySummarizationFunctionId } from '@mathesar/api/rest/types/queries';
import type { States } from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
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
  determineDisplayOptions: (dbFormValues: FormValues) => Column['metadata'];
  constructDisplayFormValuesFromDisplayOptions: (
    displayOptions: Column['metadata'],
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

/**
 * These filter ids represent the filter functions used for the _old_ filtering
 * system (circa 2023). The UI is still designed around these filter functions
 * which is why we still have code for it within the front end.
 *
 * In 2024 we moved filtering logic from the service layer into the DB layer and
 * introduced a new filtering system that is more flexible. The new filtering
 * system is much more flexible and can handle complex filtering expressions
 * with arbitrary nesting.
 *
 * Elsewhere in the front end codebase, we have a compatibility layer that
 * translates between the old filtering system and the new filtering system.
 * Search for `filterEntryToSqlExpr` to find that compatibility layer.
 *
 * If at some point we decide to design a more flexible user-facing filtering
 * UI, then we could model that UI (and the resulting front end data structures)
 * around the `SqlExpr` data structure. This would allow us to avoid the need to
 * maintain the type below because we would be able to directly support the
 * filtering expressions that the API expects.
 */
export type FilterId =
  | 'contains_case_insensitive'
  | 'email_domain_contains'
  | 'email_domain_equals'
  | 'equal'
  | 'greater_or_equal'
  | 'greater'
  | 'json_array_contains'
  | 'json_array_length_equals'
  | 'json_array_length_greater_or_equal'
  | 'json_array_length_greater_than'
  | 'json_array_length_less_or_equal'
  | 'json_array_length_less_than'
  | 'json_array_not_empty'
  | 'lesser_or_equal'
  | 'lesser'
  | 'not_null'
  | 'null'
  | 'starts_with_case_insensitive'
  | 'uri_authority_contains'
  | 'uri_scheme_equals';

export interface AbstractTypeFilterDefinitionResponse {
  id: FilterId;
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
