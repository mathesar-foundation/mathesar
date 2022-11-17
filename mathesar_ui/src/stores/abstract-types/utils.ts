import type { DbType } from '@mathesar/AppTypes';
import Fallback from './type-configs/fallback';
import type { AbstractType, AbstractTypesMap } from './types';

export const unknownAbstractType: AbstractType = {
  name: 'Other',
  identifier: 'other',
  ...Fallback,
  dbTypes: new Set([]),
};

export function identifyAbstractTypeForDbType(
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

export function getAbstractTypeForDbType(
  dbType: DbType,
  abstractTypesMap: AbstractTypesMap,
): AbstractType {
  let abstractTypeOfDbType = identifyAbstractTypeForDbType(
    dbType,
    abstractTypesMap,
  );
  if (!abstractTypeOfDbType) {
    abstractTypeOfDbType = unknownAbstractType;
  }
  return abstractTypeOfDbType;
}
