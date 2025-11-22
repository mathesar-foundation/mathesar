import { abstractTypeCategory } from '../constants';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypePreprocFunctionDefinition,
  AbstractTypePreprocFunctionDefinitionMap,
  AbstractTypePreprocFunctionsResponse,
} from '../types';

const preprocFunctionsResponse: AbstractTypePreprocFunctionsResponse[] = [
  {
    id: 'truncate_to_day',
    name: 'Year, Month, Day',
    appliesTo: [abstractTypeCategory.DateTime],
    returns: abstractTypeCategory.Text,
  },
  {
    id: 'truncate_to_year',
    name: 'Year',
    appliesTo: [abstractTypeCategory.Date, abstractTypeCategory.DateTime],
    returns: abstractTypeCategory.Number,
  },
  {
    id: 'truncate_to_month',
    name: 'Year, Month',
    appliesTo: [abstractTypeCategory.Date, abstractTypeCategory.DateTime],
    returns: abstractTypeCategory.Text,
  },
  {
    id: 'uri_scheme',
    name: 'URI scheme',
    appliesTo: [abstractTypeCategory.Uri],
    returns: abstractTypeCategory.Text,
  },
  {
    id: 'uri_authority',
    name: 'URI Authority',
    appliesTo: [abstractTypeCategory.Uri],
    returns: abstractTypeCategory.Text,
  },
  {
    id: 'email_domain',
    name: 'Domain',
    appliesTo: [abstractTypeCategory.Email],
    returns: abstractTypeCategory.Text,
  },
];

function getAbstractTypeToPreprocFunctionMap(): AbstractTypePreprocFunctionDefinitionMap {
  const categories =
    Object.values<AbstractTypeCategoryIdentifier>(abstractTypeCategory);
  const abstractTypeToPreprocFunctionMap: AbstractTypePreprocFunctionDefinitionMap =
    new Map();
  categories.forEach((category) => {
    if (!abstractTypeToPreprocFunctionMap.has(category)) {
      abstractTypeToPreprocFunctionMap.set(category, []);
    }
    const preprocFunctionDefinitions =
      abstractTypeToPreprocFunctionMap.get(category);
    preprocFunctionsResponse.forEach((preprocFunction) => {
      if (preprocFunction.appliesTo.includes(category)) {
        preprocFunctionDefinitions?.push({
          id: preprocFunction.id,
          name: preprocFunction.name,
          returns: preprocFunction.returns,
          possibleReturnValues: preprocFunction.possibleReturnValues,
        });
      }
    });
  });
  return abstractTypeToPreprocFunctionMap;
}

export const abstractTypeToPreprocFunctionMap =
  getAbstractTypeToPreprocFunctionMap();

export function getPreprocFunctionsForAbstractType(
  categoryIdentifier: AbstractTypeCategoryIdentifier,
): AbstractTypePreprocFunctionDefinition[] {
  return abstractTypeToPreprocFunctionMap.get(categoryIdentifier) ?? [];
}
