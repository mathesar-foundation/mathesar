import type { DbType } from '@mathesar/AppTypes';
import { abstractTypeCategory } from './constants';
import Text, { DB_TYPES as textDbTypes } from './type-configs/text';
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
import jsonArrayFactory from './type-configs/comboTypes/jsonArrayFactory';
import jsonObjectFactory from './type-configs/comboTypes/jsonObjectFactory';
import arrayFactory from './type-configs/comboTypes/arrayFactory';
import type {
  AbstractType,
  AbstractTypesMap,
  AbstractTypeResponse,
  AbstractTypeCategoryIdentifier,
  AbstractTypeConfigurationPartialMap,
  AbstractTypeConfigurationFactory,
} from './types';
import { unknownAbstractType, identifyAbstractTypeForDbType } from './utils';

/**
 * This is meant to be serializable and replaced by an API
 * at a later point
 */
const simpleAbstractTypeCategories: AbstractTypeConfigurationPartialMap = {
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
};

const comboAbstractTypeCategories: Partial<
  Record<AbstractTypeCategoryIdentifier, AbstractTypeConfigurationFactory>
> = {
  [abstractTypeCategory.Array]: arrayFactory,
  [abstractTypeCategory.JsonArray]: jsonArrayFactory,
  [abstractTypeCategory.JsonObject]: jsonObjectFactory,
};

export const defaultDbType = textDbTypes.VARCHAR;

export function constructAbstractTypeMapFromResponse(
  abstractTypesResponse: AbstractTypeResponse[],
): AbstractTypesMap {
  const simpleAbstractTypesMap: Map<AbstractType['identifier'], AbstractType> =
    new Map();
  const complexAbstractTypeFactories: (Pick<
    AbstractType,
    'identifier' | 'name' | 'dbTypes'
  > & { factory: AbstractTypeConfigurationFactory })[] = [];

  abstractTypesResponse.forEach((entry) => {
    if (entry.identifier === 'other') {
      /**
       * Ignore "Other" type sent in response.
       * This is a failsafe to ensure that the frontend does not
       * break when the "Other" type does not contain db_types which
       * are either the type or valid_target_type for any column.
       */
      return;
    }

    const partialAbstractType = {
      identifier: entry.identifier,
      name: entry.name,
      dbTypes: new Set(entry.db_types),
    };

    const simpleAbstractTypeCategory =
      simpleAbstractTypeCategories[entry.identifier];
    if (simpleAbstractTypeCategory) {
      simpleAbstractTypesMap.set(entry.identifier, {
        ...partialAbstractType,
        ...simpleAbstractTypeCategory,
      });
      return;
    }

    const complexAbstractTypeFactory =
      comboAbstractTypeCategories[entry.identifier];
    if (complexAbstractTypeFactory) {
      complexAbstractTypeFactories.push({
        ...partialAbstractType,
        factory: complexAbstractTypeFactory,
      });
      return;
    }

    simpleAbstractTypesMap.set(entry.identifier, {
      ...partialAbstractType,
      ...Fallback,
    });
  });

  const abstractTypesMap: AbstractTypesMap = new Map(simpleAbstractTypesMap);

  complexAbstractTypeFactories.forEach((entry) => {
    abstractTypesMap.set(entry.identifier, {
      identifier: entry.identifier,
      name: entry.name,
      dbTypes: entry.dbTypes,
      ...entry.factory(simpleAbstractTypesMap),
    });
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
    abstractTypeList.push(unknownAbstractType);
  }
  return abstractTypeList;
}

export function getAllowedAbstractTypesForNewColumn(
  abstractTypesMap: AbstractTypesMap,
) {
  return [...abstractTypesMap.values()]
    .filter((type) => !comboAbstractTypeCategories[type.identifier])
    .sort((a, b) => a.name.localeCompare(b.name));
}
