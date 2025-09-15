import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type { DbType } from '@mathesar/AppTypes';
import {
  iconUiTypeArray,
  iconUiTypeJsonArray,
  iconUiTypeJsonObject,
} from '@mathesar/icons';

import { abstractTypeCategory } from './constants';
import { DB_TYPES } from './dbTypes';
import Boolean from './type-configs/boolean';
import Date from './type-configs/date';
import DateTime from './type-configs/datetime';
import Duration from './type-configs/duration';
import Email from './type-configs/email';
import Fallback from './type-configs/fallback';
import File from './type-configs/file';
import Json from './type-configs/json';
import Money from './type-configs/money';
import Number from './type-configs/number';
import Text from './type-configs/text';
import Time from './type-configs/time';
import Uri from './type-configs/uri';
import Uuid from './type-configs/uuid';
import { typeCastMap } from './typeCastMap';
import type {
  AbstractType,
  AbstractTypeCategoryIdentifier,
  AbstractTypeConfigurationFactory,
  AbstractTypeConfigurationPartialMap,
  AbstractTypeResponse,
  AbstractTypesMap,
} from './types';

const unknownAbstractType: AbstractType = {
  name: 'Other',
  identifier: 'other',
  ...Fallback,
  dbTypes: new Set([]),
};

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
  [abstractTypeCategory.Uuid]: Uuid,
  [abstractTypeCategory.Json]: Json,
  [abstractTypeCategory.File]: File,
};

export const arrayFactory: AbstractTypeConfigurationFactory = () => ({
  getIcon: (args) => {
    const arrayIcon = { ...iconUiTypeArray, label: 'Array' };
    const itemType = args?.typeOptions?.item_type ?? undefined;
    if (!itemType) return arrayIcon;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const innerAbstractType = getAbstractTypeForDbType(
      itemType,
      args?.metadata ?? null,
    );
    const innerIcon = innerAbstractType.getIcon();
    const innerIcons = Array.isArray(innerIcon) ? innerIcon : [innerIcon];
    return [arrayIcon, ...innerIcons];
  },
  cellInfo: {
    type: 'array',
  },
});

const jsonArrayFactory: AbstractTypeConfigurationFactory = () => ({
  getIcon: () => iconUiTypeJsonArray,
  defaultDbType: 'mathesar_types.mathesar_json_array',
  cellInfo: {
    type: 'string',
  },
});

const jsonObjectFactory: AbstractTypeConfigurationFactory = () => ({
  getIcon: () => iconUiTypeJsonObject,
  defaultDbType: 'mathesar_types.mathesar_json_object',
  cellInfo: {
    type: 'string',
  },
});

const comboAbstractTypeCategories: Partial<
  Record<AbstractTypeCategoryIdentifier, AbstractTypeConfigurationFactory>
> = {
  [abstractTypeCategory.Array]: arrayFactory,
  [abstractTypeCategory.JsonArray]: jsonArrayFactory,
  [abstractTypeCategory.JsonObject]: jsonObjectFactory,
};

function constructAbstractTypeMapFromResponse(
  abstractTypesResponse: AbstractTypeResponse[],
): AbstractTypesMap {
  const simpleAbstractTypesMap: Map<AbstractType['identifier'], AbstractType> =
    new Map();
  const complexAbstractTypeFactories: (Pick<
    AbstractType,
    'identifier' | 'name' | 'dbTypes'
  > & { factory: AbstractTypeConfigurationFactory })[] = [];

  abstractTypesResponse.forEach((entry) => {
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

  const result: AbstractTypesMap = new Map(simpleAbstractTypesMap);

  complexAbstractTypeFactories.forEach((entry) => {
    result.set(entry.identifier, {
      identifier: entry.identifier,
      name: entry.name,
      dbTypes: entry.dbTypes,
      ...entry.factory(),
    });
  });
  return result;
}

/**
 * This is called "Response" because we originally designed the types
 * architecture to be client-server oriented. But later we decided to hard-code
 * this data in the front end.
 */
const typesResponse: AbstractTypeResponse[] = [
  {
    identifier: 'boolean',
    name: 'Boolean',
    db_types: [DB_TYPES.BOOLEAN],
  },
  {
    identifier: 'date',
    name: 'Date',
    db_types: [DB_TYPES.DATE],
  },
  {
    identifier: 'time',
    name: 'Time',
    db_types: [DB_TYPES.TIME_WITH_TZ, DB_TYPES.TIME_WITHOUT_TZ],
  },
  {
    identifier: 'datetime',
    name: 'Date & Time',
    db_types: [DB_TYPES.TIMESTAMP_WITH_TZ, DB_TYPES.TIMESTAMP_WITHOUT_TZ],
  },
  {
    identifier: 'duration',
    name: 'Duration',
    db_types: [DB_TYPES.INTERVAL],
  },
  {
    identifier: 'email',
    name: 'Email',
    db_types: [DB_TYPES.MSAR__EMAIL],
  },
  {
    identifier: 'money',
    name: 'Money',
    db_types: [
      DB_TYPES.MONEY,
      DB_TYPES.MSAR__MATHESAR_MONEY,
      DB_TYPES.MSAR__MULTICURRENCY_MONEY,
    ],
  },
  {
    identifier: 'number',
    name: 'Number',
    db_types: [
      DB_TYPES.DOUBLE_PRECISION,
      DB_TYPES.REAL,
      DB_TYPES.SMALLINT,
      DB_TYPES.BIGINT,
      DB_TYPES.INTEGER,
      DB_TYPES.NUMERIC,
    ],
  },
  {
    identifier: 'text',
    name: 'Text',
    db_types: [
      DB_TYPES.CHAR,
      DB_TYPES.CHARACTER_VARYING,
      DB_TYPES.CHARACTER,
      DB_TYPES.NAME,
      DB_TYPES.TEXT,
    ],
  },
  {
    identifier: 'uri',
    name: 'URI',
    db_types: [DB_TYPES.MSAR__URI],
  },
  {
    identifier: 'uuid',
    name: 'UUID',
    db_types: [DB_TYPES.UUID],
  },
  {
    identifier: 'jsonlist',
    name: 'JSON List',
    db_types: [DB_TYPES.MSAR__MATHESAR_JSON_ARRAY],
  },
  {
    identifier: 'map',
    name: 'Map',
    db_types: [DB_TYPES.MSAR__MATHESAR_JSON_OBJECT],
  },
  {
    identifier: 'json',
    name: 'JSON',
    db_types: [DB_TYPES.JSON, DB_TYPES.JSONB],
  },
  {
    identifier: 'array',
    name: 'Array',
    db_types: [DB_TYPES.ARRAY],
  },
  // TODO_FILES: Move this to a separate array
  {
    identifier: 'file',
    name: 'File',
    db_types: [DB_TYPES.JSONB],
  },
];

const abstractTypesMap = constructAbstractTypeMapFromResponse(typesResponse);

export const defaultAbstractType = (() => {
  const textType = abstractTypesMap.get('text');
  if (!textType) {
    throw new Error('Text UI type not found. This should never happen');
  }
  return textType;
})();

function identifyAbstractTypeForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType | undefined {
  if (metadata?.file_backend && dbType === DB_TYPES.JSONB) {
    const fileUiType = abstractTypesMap.get('file');
    if (fileUiType) {
      return fileUiType;
    }
  }
  let abstractTypeOfDbType;
  for (const [, abstractType] of abstractTypesMap) {
    if (abstractType.dbTypes.has(dbType)) {
      abstractTypeOfDbType = abstractType;
      break;
    }
  }
  return abstractTypeOfDbType;
}

// TODO_FILES: Rewrite this
function identifyAllPossibleAbstractTypesForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): Set<AbstractType> {
  const allPossibleAbstractTypes: Set<AbstractType> = new Set();
  if (dbType === DB_TYPES.JSONB && metadata?.file_backend) {
    const fileUiType = abstractTypesMap.get('file');
    if (fileUiType) {
      allPossibleAbstractTypes.add(fileUiType);
    }
  }
  for (const [, abstractType] of abstractTypesMap) {
    if (abstractType.dbTypes.has(dbType)) {
      allPossibleAbstractTypes.add(abstractType);
    }
  }
  return allPossibleAbstractTypes;
}

export function getAbstractTypeForDbType(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType {
  let abstractTypeOfDbType = identifyAbstractTypeForDbType(dbType, metadata);
  if (!abstractTypeOfDbType) {
    abstractTypeOfDbType = unknownAbstractType;
  }
  return abstractTypeOfDbType;
}

export function getAllowedAbstractTypesForDbTypeAndItsTargetTypes(
  dbType: DbType,
  metadata: ColumnMetadata | null,
): AbstractType[] {
  const abstractTypeSet: Set<AbstractType> = new Set();

  const abstractTypeOfDbType = identifyAbstractTypeForDbType(dbType, metadata);
  if (abstractTypeOfDbType) {
    abstractTypeSet.add(abstractTypeOfDbType);
  }

  const targetDbTypes = typeCastMap[dbType] ?? [];
  targetDbTypes.forEach((targetDbType) => {
    const abstractTypes = identifyAllPossibleAbstractTypesForDbType(
      targetDbType,
      metadata,
    );
    [...abstractTypes].forEach((absType) => abstractTypeSet.add(absType));
  });
  const abstractTypeList = [...abstractTypeSet].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (!abstractTypeOfDbType) {
    abstractTypeList.push(unknownAbstractType);
  }
  return abstractTypeList;
}

export function getAllowedAbstractTypesForNewColumn() {
  return [...abstractTypesMap.values()]
    .filter((type) => !comboAbstractTypeCategories[type.identifier])
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDefaultDbTypeOfAbstractType(
  abstractType: AbstractType,
): DbType {
  if (abstractType.defaultDbType) {
    return abstractType.defaultDbType;
  }
  if (abstractType.dbTypes.size > 0) {
    return [...abstractType.dbTypes][0];
  }
  return DB_TYPES.TEXT;
}

export function getDbTypesForAbstractType(
  abstractTypeIdentifier: AbstractType['identifier'],
): Set<DbType> {
  return abstractTypesMap.get(abstractTypeIdentifier)?.dbTypes ?? new Set();
}
