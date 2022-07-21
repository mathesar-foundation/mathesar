import type { DbType } from '@mathesar/AppTypes';
import { abstractTypeCategory } from './constants';
import Text from './type-configs/text';
import Money from './type-configs/money';
import Email from './type-configs/email';
import Number from './type-configs/number';
import Boolean from './type-configs/boolean';
import Uri from './type-configs/uri';
import Duration from './type-configs/duration';
import Date from './type-configs/date';
import Time from './type-configs/time';
import DateTime from './type-configs/datetime';
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
  [abstractTypeCategory.Email]: Email,
  [abstractTypeCategory.Number]: Number,
  [abstractTypeCategory.Boolean]: Boolean,
  [abstractTypeCategory.Uri]: Uri,
  [abstractTypeCategory.Duration]: Duration,
  [abstractTypeCategory.Date]: Date,
  [abstractTypeCategory.Time]: Time,
  [abstractTypeCategory.DateTime]: DateTime,
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
    /**
     * Ignore "Other" type sent in response.
     * This is a failsafe to ensure that the frontend does not
     * break when the "Other" type does not contain db_types which
     * are either the type or valid_target_type for any column.
     */
    if (entry.identifier !== 'other') {
      abstractTypesMap.set(
        entry.identifier,
        constructAbstractTypeFromResponse(entry),
      );
    }
  });
  return abstractTypesMap;
}

function identifyAbstractTypeForDbType(
  dbType: DbType,
  abstractTypesMap: AbstractTypesMap,
): AbstractType | undefined {
  let abstractTypeOfDbType;
  for (const [, abstractType] of abstractTypesMap) {
    if (abstractType.dbTypes.has(dbType)) {
      abstractTypeOfDbType = abstractType;
      break;
    }
  }
  return abstractTypeOfDbType;
}

/**
 * For columns, allowed db types should be an intersection of valid_target_types
 * and dbTypes of each abstract type. i.e
 * const allowedDBTypes = intersection(dbTargetTypeSet, abstractType.dbTypes);
 *
 * However, it is not handled here yet, since it requires additional confirmation.
 */
export function getAllowedAbstractTypesForDbTypeAndItsTargetTypes(
  dbType: DbType,
  targetDbTypes: DbType[],
  abstractTypesMap: AbstractTypesMap,
): AbstractType[] {
  const abstractTypeSet: Set<AbstractType> = new Set();

  const abstractTypeOfDbType = identifyAbstractTypeForDbType(
    dbType,
    abstractTypesMap,
  );
  if (abstractTypeOfDbType) {
    abstractTypeSet.add(abstractTypeOfDbType);
  }

  targetDbTypes.forEach((targetDbType) => {
    const abstractType = identifyAbstractTypeForDbType(
      targetDbType,
      abstractTypesMap,
    );
    if (abstractType) {
      abstractTypeSet.add(abstractType);
    }
  });
  const abstractTypeList = [...abstractTypeSet].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (!abstractTypeOfDbType) {
    abstractTypeList.push(
      constructAbstractTypeFromResponse(unknownAbstractTypeResponse),
    );
  }
  return abstractTypeList;
}

export function getAbstractTypeForDbType(
  dbType: DbType,
  abstractTypesMap: AbstractTypesMap,
): AbstractType {
  let abstractTypeOfDbType = identifyAbstractTypeForDbType(
    dbType,
    abstractTypesMap,
  );
  if (!abstractTypeOfDbType) {
    abstractTypeOfDbType = constructAbstractTypeFromResponse(
      unknownAbstractTypeResponse,
    );
  }
  return abstractTypeOfDbType;
}
