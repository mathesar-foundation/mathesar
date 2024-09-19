import { constructAbstractTypeMapFromResponse } from './abstractTypeCategories';
import { DB_TYPES } from './dbTypes';
import type { AbstractTypeResponse } from './types';

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
    identifier: 'array',
    name: 'Array',
    db_types: [DB_TYPES.ARRAY],
  },
];

export const abstractTypesMap =
  constructAbstractTypeMapFromResponse(typesResponse);
