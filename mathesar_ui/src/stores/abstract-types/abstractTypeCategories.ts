import type { DbType } from '@mathesar/AppTypes';
import { abstractTypeCategory } from './constants';
import Text from './type-configs/text';
import Money from './type-configs/money';
import Number from './type-configs/number';
import Boolean from './type-configs/boolean';
import Uri from './type-configs/uri';
import Duration from './type-configs/duration';
import Fallback from './type-configs/fallback';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypeResponse,
  AbstractTypeConfiguration,
  AbstractTypeCategoryIdentifier,
} from './types';

/**
 * This is meant to be serializable and replaced by an API
 * at a later point
 */
const abstractTypeCategories: Partial<
  Record<AbstractTypeCategoryIdentifier, AbstractTypeConfiguration>
> = {
  [abstractTypeCategory.Text]: Text,
  [abstractTypeCategory.Money]: Money,
  [abstractTypeCategory.Number]: Number,
  [abstractTypeCategory.Boolean]: Boolean,
  [abstractTypeCategory.Uri]: Uri,
  [abstractTypeCategory.Duration]: Duration,
  [abstractTypeCategory.Other]: Fallback,
};

export const unknownAbstractTypeResponse: AbstractTypeResponse = {
  name: 'Other',
  identifier: 'other',
  db_types: [],
};

function getAbstractTypeConfiguration(
  identifier: AbstractType['identifier'],
): AbstractTypeConfiguration {
  return abstractTypeCategories[identifier] || Fallback;
}

function constructAbstractTypeFromResponse(
  response: AbstractTypeResponse,
): AbstractType {
  return {
    identifier: response.identifier,
    name: response.name,
    ...getAbstractTypeConfiguration(response.identifier),
    dbTypes: new Set(response.db_types),
  } as AbstractType;
}

export function constructAbstractTypeMapFromResponse(
  abstractTypesResponse: AbstractTypeResponse[],
): AbstractTypesMap {
  const abstractTypesMap: AbstractTypesMap = new Map();
  abstractTypesResponse.forEach((entry) => {
    abstractTypesMap.set(
      entry.identifier,
      constructAbstractTypeFromResponse(entry),
    );
  });
  return abstractTypesMap;
}

/**
 * For columns, allowed db types should be an intersection of valid_target_types
 * and dbTypes of each abstract type. i.e
 * const allowedDBTypes = intersection(dbTargetTypeSet, abstractType.dbTypes);
 *
 * However, it is not handled here yet, since it requires additional confirmation.
 */
export function getAbstractTypesForDbTypeList(
  dbTypes: DbType[],
  abstractTypesMap: AbstractTypesMap,
): AbstractType[] {
  if (dbTypes && abstractTypesMap) {
    const abstractTypeSet: Set<AbstractType> = new Set();
    let isUnknownTypeRequired = false;
    dbTypes.forEach((dbType) => {
      let isKnownType = false;
      for (const [, abstractType] of abstractTypesMap) {
        if (abstractType.dbTypes.has(dbType)) {
          abstractTypeSet.add(abstractType);
          isKnownType = true;
          break;
        }
      }
      if (!isKnownType) {
        isUnknownTypeRequired = true;
      }
    });
    const abstractTypeList = [...abstractTypeSet].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    if (isUnknownTypeRequired) {
      abstractTypeList.push(
        constructAbstractTypeFromResponse(unknownAbstractTypeResponse),
      );
    }
    return abstractTypeList;
  }
  return [];
}

export function getAbstractTypeForDbType(
  dbType: DbType,
  abstractTypesMap: AbstractTypesMap,
): AbstractType {
  return (
    getAbstractTypesForDbTypeList([dbType], abstractTypesMap)[0] ||
    constructAbstractTypeFromResponse(unknownAbstractTypeResponse)
  );
}
