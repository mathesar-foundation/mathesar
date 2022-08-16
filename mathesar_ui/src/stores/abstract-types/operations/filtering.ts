import { abstractTypeCategory } from '../constants';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypeFilterDefinitionResponse,
  AbstractTypeFilterDefinitionMap,
  AbstractTypeFilterDefinition,
} from '../types';

const allDateTimeTypes = [
  abstractTypeCategory.Date,
  abstractTypeCategory.Time,
  abstractTypeCategory.DateTime,
];

const numericallyOperableTypesParams = {
  [abstractTypeCategory.DateTime]: [abstractTypeCategory.DateTime],
  [abstractTypeCategory.Date]: [abstractTypeCategory.Date],
  [abstractTypeCategory.Time]: [abstractTypeCategory.Time],
  [abstractTypeCategory.Duration]: [abstractTypeCategory.Duration],
  [abstractTypeCategory.Number]: [abstractTypeCategory.Number],
  [abstractTypeCategory.Money]: [abstractTypeCategory.Money],
};

function constructAliasMapForTypes(
  categories: AbstractTypeCategoryIdentifier[],
  alias: string,
): Record<AbstractTypeCategoryIdentifier, string> {
  const map: Map<AbstractTypeCategoryIdentifier, string> = new Map(
    categories.map((category) => [category, alias]),
  );
  return Object.fromEntries(map) as Record<
    AbstractTypeCategoryIdentifier,
    string
  >;
}

function constructParamMapForAllTypes(
  getParamsForType: (
    category: AbstractTypeCategoryIdentifier,
  ) => AbstractTypeCategoryIdentifier[],
): Record<AbstractTypeCategoryIdentifier, AbstractTypeCategoryIdentifier[]> {
  const categories =
    Object.values<AbstractTypeCategoryIdentifier>(abstractTypeCategory);
  const map: Map<
    AbstractTypeCategoryIdentifier,
    AbstractTypeCategoryIdentifier[]
  > = new Map(
    categories.map((category) => [category, getParamsForType(category)]),
  );
  return Object.fromEntries(map) as Record<
    AbstractTypeCategoryIdentifier,
    AbstractTypeCategoryIdentifier[]
  >;
}

// This is the API response expected from the server
// Might be better if we can have this with the types endpoint
const filterResponse: AbstractTypeFilterDefinitionResponse[] = [
  {
    id: 'contains_case_insensitive',
    name: 'contains',
    uiTypeParameterMap: {
      [abstractTypeCategory.Text]: [abstractTypeCategory.Text],
      [abstractTypeCategory.Email]: [abstractTypeCategory.Text],
      [abstractTypeCategory.Uri]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'starts_with_case_insensitive',
    name: 'starts with',
    uiTypeParameterMap: {
      [abstractTypeCategory.Text]: [abstractTypeCategory.Text],
      [abstractTypeCategory.Email]: [abstractTypeCategory.Text],
      [abstractTypeCategory.Uri]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'uri_scheme_equals',
    name: 'URI scheme is',
    uiTypeParameterMap: {
      [abstractTypeCategory.Uri]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'uri_authority_contains',
    name: 'URI authority contains',
    uiTypeParameterMap: {
      [abstractTypeCategory.Uri]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'json_array_length_equals',
    name: 'number of elements is',
    uiTypeParameterMap: {
      [abstractTypeCategory.Array]: [abstractTypeCategory.Number],
    },
  },
  {
    id: 'json_array_length_greater_than',
    name: 'number of elements is greater than',
    uiTypeParameterMap: {
      [abstractTypeCategory.Array]: [abstractTypeCategory.Number],
    },
  },
  {
    id: 'json_array_length_greater_or_equal',
    name: 'number of elements is greater than or equal to',
    uiTypeParameterMap: {
      [abstractTypeCategory.Array]: [abstractTypeCategory.Number],
    },
  },
  {
    id: 'json_array_length_less_than',
    name: 'number of elements is less than',
    uiTypeParameterMap: {
      [abstractTypeCategory.Array]: [abstractTypeCategory.Number],
    },
  },
  {
    id: 'json_array_length_less_or_equal',
    name: 'number of elements is less than or equal to',
    uiTypeParameterMap: {
      [abstractTypeCategory.Array]: [abstractTypeCategory.Number],
    },
  },
  {
    id: 'email_domain_equals',
    name: 'email domain is',
    uiTypeParameterMap: {
      [abstractTypeCategory.Email]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'email_domain_contains',
    name: 'email domain contains',
    uiTypeParameterMap: {
      [abstractTypeCategory.Email]: [abstractTypeCategory.Text],
    },
  },
  {
    id: 'lesser',
    name: 'is lesser than',
    aliases: constructAliasMapForTypes(allDateTimeTypes, 'is before'),
    uiTypeParameterMap: numericallyOperableTypesParams,
  },
  {
    id: 'greater',
    name: 'is greater than',
    aliases: constructAliasMapForTypes(allDateTimeTypes, 'is after'),
    uiTypeParameterMap: numericallyOperableTypesParams,
  },
  {
    id: 'lesser_or_equal',
    name: 'is lesser or equal to',
    aliases: constructAliasMapForTypes(
      allDateTimeTypes,
      'is before or same as',
    ),
    uiTypeParameterMap: numericallyOperableTypesParams,
  },
  {
    id: 'greater_or_equal',
    name: 'is greater or equal to',
    aliases: constructAliasMapForTypes(allDateTimeTypes, 'is after or same as'),
    uiTypeParameterMap: numericallyOperableTypesParams,
  },
  {
    id: 'equal',
    name: 'is equal to',
    aliases: constructAliasMapForTypes(allDateTimeTypes, 'is same as'),
    uiTypeParameterMap: constructParamMapForAllTypes((category) => [category]),
  },
  {
    id: 'empty',
    name: 'is empty',
    uiTypeParameterMap: constructParamMapForAllTypes(() => []),
  },
];

function getFilterDefinitionMap(): AbstractTypeFilterDefinitionMap {
  const categories =
    Object.values<AbstractTypeCategoryIdentifier>(abstractTypeCategory);
  const filterDefinitionMap: AbstractTypeFilterDefinitionMap = new Map();
  categories.forEach((category) => {
    if (!filterDefinitionMap.has(category)) {
      filterDefinitionMap.set(category, []);
    }
    const filterDefinitions = filterDefinitionMap.get(category);

    filterResponse.forEach((filter) => {
      if (filter.uiTypeParameterMap[category]) {
        filterDefinitions?.push({
          id: filter.id,
          name: filter.aliases?.[category] ?? filter.name,
          parameters: filter.uiTypeParameterMap[category] ?? [],
        });
      }
    });
  });
  return filterDefinitionMap;
}

export const filterDefinitionMap = getFilterDefinitionMap();

export function getFiltersForAbstractType(
  categoryIdentifier: AbstractTypeCategoryIdentifier,
): Map<AbstractTypeFilterDefinition['id'], AbstractTypeFilterDefinition> {
  const allowedFiltersMap: Map<
    AbstractTypeFilterDefinition['id'],
    AbstractTypeFilterDefinition
  > = new Map();

  filterDefinitionMap.get(categoryIdentifier)?.forEach((filter) => {
    allowedFiltersMap.set(filter.id, filter);
  });

  return allowedFiltersMap;
}
