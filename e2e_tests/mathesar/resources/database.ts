import { z } from 'zod';
import { defineResource } from '../../framework/src';

export const Database = defineResource({
  type: 'database',
  schema: z.object({
    databaseName: z.string(),
    databaseDisplayName: z.string(),
  }),
  key: (db) => db.databaseName,
});

export const Schema = defineResource({
  type: 'schema',
  schema: z.object({
    databaseName: z.string(),
    schemaName: z.string(),
  }),
  key: (s) => `${s.databaseName}/${s.schemaName}`,
  parent: { type: Database, key: (s) => s.databaseName },
});
