import type { DbType } from '@mathesar/App.d';
import { abstractTypeCategory, unknownAbstractTypeResponse } from './constants';
import Text from './type-configs/text';
import Number from './type-configs/number';
import Boolean from './type-configs/boolean';
import Unknown from './type-configs/unknown';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypeResponse,
  AbstractTypeConfiguration,
} from './types';

/**
 * This is meant to be serializable and replaced by an API
 * at a later point
 */
const abstractTypeCategories = {
  [abstractTypeCategory.Text]: Text,
  [abstractTypeCategory.Number]: Number,
  [abstractTypeCategory.Boolean]: Boolean,
  [abstractTypeCategory.Other]: Unknown,
};

function getAbstractTypeConfiguration(
  identifier: AbstractType['identifier'],
): AbstractTypeConfiguration {
  return (
    abstractTypeCategories[identifier] ||
    abstractTypeCategories[abstractTypeCategory.Other]
  );
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
      // eslint-disable-next-line no-restricted-syntax
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
