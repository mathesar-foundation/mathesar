import { z } from 'zod';
import { defineResource } from '../../framework/src';
import { Schema } from './database';

export const Table = defineResource({
  type: 'table',
  schema: z.object({
    databaseName: z.string(),
    schemaName: z.string(),
    tableName: z.string(),
  }),
  key: (t) => `${t.databaseName}/${t.schemaName}/${t.tableName}`,
  parent: {
    type: Schema,
    key: (t) => `${t.databaseName}/${t.schemaName}`,
  },
});
