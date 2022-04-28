import { abstractTypeCategory } from '../constants';
import type {
  MathesarTypeCategoryIdentifier,
  FilterDefinitionResponse,
  FilterDefinitionMap,
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
};

function constructAliasMapForTypes(
  categories: MathesarTypeCategoryIdentifier[],
  alias: string,
): Record<MathesarTypeCategoryIdentifier, string> {
  const map: Map<MathesarTypeCategoryIdentifier, string> = new Map(
    categories.map((category) => [category, alias]),
  );
  return Object.fromEntries(map) as Record<
    MathesarTypeCategoryIdentifier,
    string
  >;
}

function constructParamMapForAllTypes(
  getParamsForType: (
    category: MathesarTypeCategoryIdentifier,
  ) => MathesarTypeCategoryIdentifier[],
): Record<MathesarTypeCategoryIdentifier, MathesarTypeCategoryIdentifier[]> {
  const categories =
    Object.values<MathesarTypeCategoryIdentifier>(abstractTypeCategory);
  const map: Map<
    MathesarTypeCategoryIdentifier,
    MathesarTypeCategoryIdentifier[]
  > = new Map(
    categories.map((category) => [category, getParamsForType(category)]),
  );
  return Object.fromEntries(map) as Record<
    MathesarTypeCategoryIdentifier,
    MathesarTypeCategoryIdentifier[]
  >;
}

// This is the API response expected from the server
const filterResponse: FilterDefinitionResponse[] = [
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

function getFilterResponseMap(): FilterDefinitionMap {
  const categories =
    Object.values<MathesarTypeCategoryIdentifier>(abstractTypeCategory);
  const filterDefinitionMap: FilterDefinitionMap = new Map();
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

const filterDefintionMap = getFilterResponseMap();

export default filterDefintionMap;
