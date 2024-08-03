import { type Readable, derived } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import {
  ImmutableMap,
  collapse,
  defined,
  unite,
} from '@mathesar/component-library';

import AsyncStore, { type AsyncStoreValue } from '../AsyncStore';

import type { RawCollaborator, RawDatabase, RawSchema, TODO } from './apiTypes';
import { Schema } from './Schema';
import type { Server } from './Server';

function buildSchemas(
  schemasListStore: Readable<AsyncStoreValue<RawSchema[], string>>,
  database: Database,
): Readable<ImmutableMap<Schema['oid'], Schema>> {
  function newSchema(rawSchema: RawSchema): Schema {
    return new Schema({ database, rawSchema });
  }
  return collapse(
    derived(schemasListStore, ({ resolvedValue }) => {
      const unsortedSchemas =
        defined(resolvedValue, (s) => s.map(newSchema)) ?? [];
      // Sort reactively based on the schema name
      const sortableSchemas = unite(
        unsortedSchemas.map((schema) =>
          derived(schema.name, (name) => ({ name, schema })),
        ),
      );
      const sortedSchemas = derived(sortableSchemas, ($sortableSchemas) =>
        $sortableSchemas
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ schema }) => schema),
      );
      return derived(
        sortedSchemas,
        (p) => new ImmutableMap(p.map((s) => [s.oid, s])),
      );
    }),
  );
}

export class Database {
  server: Server;

  id: number;

  name: string;

  schemasList: AsyncStore<void, RawSchema[]>;

  schemas: Readable<ImmutableMap<Schema['oid'], Schema>>;

  explorationsList!: AsyncStore<void, TODO[]>;

  explorations: TODO;

  collaboratorsList!: AsyncStore<void, RawCollaborator[]>;

  collaborators: TODO;

  constructor(p: { server: Server; rawDatabase: RawDatabase }) {
    this.server = p.server;
    this.id = p.rawDatabase.id;
    this.name = p.rawDatabase.name;
    this.schemasList = new AsyncStore(() =>
      api.schemas.list({ database_id: this.id }).run(),
    );
    this.schemas = buildSchemas(this.schemasList, this);
  }

  get url(): string {
    return `db/${this.id}/`;
  }
}
