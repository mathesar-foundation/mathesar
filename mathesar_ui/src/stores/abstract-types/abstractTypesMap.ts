import { constructAbstractTypeMapFromResponse } from './abstractTypeCategories';
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
    db_types: ['boolean'],
  },
  {
    identifier: 'date',
    name: 'Date',
    db_types: ['date'],
  },
  {
    identifier: 'time',
    name: 'Time',
    db_types: ['time with time zone', 'time without time zone'],
  },
  {
    identifier: 'datetime',
    name: 'Date & Time',
    db_types: ['timestamp with time zone', 'timestamp without time zone'],
  },
  {
    identifier: 'duration',
    name: 'Duration',
    db_types: ['interval'],
  },
  {
    identifier: 'email',
    name: 'Email',
    db_types: ['mathesar_types.email'],
  },
  {
    identifier: 'money',
    name: 'Money',
    db_types: [
      'mathesar_types.multicurrency_money',
      'mathesar_types.mathesar_money',
      'money',
    ],
  },
  {
    identifier: 'number',
    name: 'Number',
    db_types: [
      'double precision',
      'real',
      'smallint',
      'bigint',
      'integer',
      'numeric',
    ],
  },
  {
    identifier: 'text',
    name: 'Text',
    db_types: ['text', 'character', '"char"', 'name', 'character varying'],
  },
  {
    identifier: 'uri',
    name: 'URI',
    db_types: ['mathesar_types.uri'],
  },
  {
    identifier: 'jsonlist',
    name: 'JSON List',
    db_types: ['mathesar_types.mathesar_json_array'],
  },
  {
    identifier: 'map',
    name: 'Map',
    db_types: ['mathesar_types.mathesar_json_object'],
  },
  {
    identifier: 'array',
    name: 'Array',
    db_types: ['_array'],
  },
];

export const abstractTypesMap =
  constructAbstractTypeMapFromResponse(typesResponse);
