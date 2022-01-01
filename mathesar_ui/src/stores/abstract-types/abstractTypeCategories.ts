import type { DbType } from '@mathesar/App.d';
import {
  abstractTypeCategory,
  unknownAbstractTypeResponse,
} from './constants';
import Text from './type-configs/text';
import Number from './type-configs/number';
import Boolean from './type-configs/boolean';
import Unknown from './type-configs/unknown';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypeResponse,
  AbstractTypeConfiguration,
} from './types.d';

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
  return abstractTypeCategories[identifier]
    || abstractTypeCategories[abstractTypeCategory.Other];
}

function constructAbstractTypeFromResponse(response: AbstractTypeResponse): AbstractType {
  return {
    ...response,
    ...getAbstractTypeConfiguration[response.identifier],
    dbTypes: new Set(response.db_types),
  } as AbstractType;
}

export function constructAbstractTypeMapFromResponse(
  abstractTypesResponse: AbstractTypeResponse[],
): AbstractTypesMap {
  const abstractTypesMap: AbstractTypesMap = new Map();
  abstractTypesResponse.forEach((entry) => {
    abstractTypesMap.set(entry.identifier, constructAbstractTypeFromResponse(entry));
  });
  return abstractTypesMap;
}

export function getAbstractTypeForDBType(
  dbType: DbType, abstractTypesMap: AbstractTypesMap,
): AbstractType {
  if (dbType && abstractTypesMap) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, abstractType] of abstractTypesMap) {
      if (abstractType.dbTypes.has(dbType)) {
        return abstractType;
      }
    }
  }
  return constructAbstractTypeFromResponse(unknownAbstractTypeResponse);
}
