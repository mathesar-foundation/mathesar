import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { defineResource } from '../engine/define-resource';

describe('defineResource', () => {
  it('returns a ResourceHandle with correct type, schema, and key', () => {
    const schema = z.object({ name: z.string(), displayName: z.string() });
    const handle = defineResource({
      type: 'database',
      schema,
      key: (db) => db.name,
    });

    expect(handle.type).toBe('database');
    expect(handle.schema).toBe(schema);
    expect(handle.key({ name: 'Movies', displayName: 'Movies' })).toBe('Movies');
  });

  it('key function handles composite keys', () => {
    const handle = defineResource({
      type: 'schema',
      schema: z.object({ dbName: z.string(), schemaName: z.string() }),
      key: (s) => `${s.dbName}/${s.schemaName}`,
    });

    expect(handle.key({ dbName: 'Movies', schemaName: 'public' })).toBe(
      'Movies/public',
    );
  });

  it('stores parent reference when provided', () => {
    const Database = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    const Schema = defineResource({
      type: 'schema',
      schema: z.object({ dbName: z.string(), schemaName: z.string() }),
      key: (s) => `${s.dbName}/${s.schemaName}`,
      parent: { type: Database, key: (s) => s.dbName },
    });

    expect(Schema.parent).toBeDefined();
    expect(Schema.parent!.type).toBe(Database);
    expect(Schema.parent!.key({ dbName: 'Movies', schemaName: 'public' })).toBe(
      'Movies',
    );
  });

  it('has no parent when not provided', () => {
    const handle = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    expect(handle.parent).toBeUndefined();
  });

  describe('.creates()', () => {
    it('returns a ResourceOp with correct properties', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const op = Database.creates('database');

      expect(op.resourceHandle).toBe(Database);
      expect(op.op).toBe('create');
      expect(op.field).toBe('database');
      expect(op.children).toEqual([]);
    });
  });

  describe('.updates()', () => {
    it('returns a ResourceOp with correct properties', () => {
      const User = defineResource({
        type: 'user',
        schema: z.object({ username: z.string() }),
        key: (u) => u.username,
      });

      const op = User.updates('user');

      expect(op.resourceHandle).toBe(User);
      expect(op.op).toBe('update');
      expect(op.field).toBe('user');
      expect(op.children).toEqual([]);
    });
  });

  describe('.deletes()', () => {
    it('returns a ResourceOp with correct properties', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const op = Database.deletes('database');

      expect(op.resourceHandle).toBe(Database);
      expect(op.op).toBe('delete');
      expect(op.field).toBe('database');
      expect(op.children).toEqual([]);
    });
  });

  describe('.with() chaining', () => {
    it('adds a valid child resource operation', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const Schema = defineResource({
        type: 'schema',
        schema: z.object({ dbName: z.string(), schemaName: z.string() }),
        key: (s) => `${s.dbName}/${s.schemaName}`,
        parent: { type: Database, key: (s) => s.dbName },
      });

      const op = Database.creates('database').with(Schema.creates('schema'));

      expect(op.resourceHandle).toBe(Database);
      expect(op.op).toBe('create');
      expect(op.field).toBe('database');
      expect(op.children).toHaveLength(1);
      expect(op.children[0].resourceHandle).toBe(Schema);
      expect(op.children[0].op).toBe('create');
      expect(op.children[0].field).toBe('schema');
    });

    it('supports multiple children via chaining', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const Schema = defineResource({
        type: 'schema',
        schema: z.object({ dbName: z.string(), schemaName: z.string() }),
        key: (s) => `${s.dbName}/${s.schemaName}`,
        parent: { type: Database, key: (s) => s.dbName },
      });

      const op = Database.creates('database')
        .with(Schema.creates('schema1'))
        .with(Schema.creates('schema2'));

      expect(op.children).toHaveLength(2);
      expect(op.children[0].field).toBe('schema1');
      expect(op.children[1].field).toBe('schema2');
    });

    it('throws when child resource is not nested under parent', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const User = defineResource({
        type: 'user',
        schema: z.object({ username: z.string() }),
        key: (u) => u.username,
      });

      expect(() =>
        Database.creates('database').with(User.creates('user')),
      ).toThrow(
        /Resource 'user' is not a child of 'database'/,
      );
    });

    it('throws when resource has no parent at all', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const OtherRoot = defineResource({
        type: 'other-root',
        schema: z.object({ id: z.string() }),
        key: (o) => o.id,
      });

      expect(() =>
        Database.creates('database').with(OtherRoot.creates('other')),
      ).toThrow(
        /Resource 'other-root' is not a child of 'database'/,
      );
    });

    it('preserves parent op properties when chaining', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const Schema = defineResource({
        type: 'schema',
        schema: z.object({ dbName: z.string(), schemaName: z.string() }),
        key: (s) => `${s.dbName}/${s.schemaName}`,
        parent: { type: Database, key: (s) => s.dbName },
      });

      const original = Database.creates('db');
      const chained = original.with(Schema.creates('sch'));

      // Original is not mutated
      expect(original.children).toHaveLength(0);
      // Chained has the child
      expect(chained.children).toHaveLength(1);
      // Parent properties preserved
      expect(chained.resourceHandle).toBe(Database);
      expect(chained.op).toBe('create');
      expect(chained.field).toBe('db');
    });

    it('supports deep nesting (grandchild)', () => {
      const Database = defineResource({
        type: 'database',
        schema: z.object({ name: z.string() }),
        key: (db) => db.name,
      });

      const Schema = defineResource({
        type: 'schema',
        schema: z.object({ dbName: z.string(), schemaName: z.string() }),
        key: (s) => `${s.dbName}/${s.schemaName}`,
        parent: { type: Database, key: (s) => s.dbName },
      });

      const Table = defineResource({
        type: 'table',
        schema: z.object({
          dbName: z.string(),
          schemaName: z.string(),
          tableName: z.string(),
        }),
        key: (t) => `${t.dbName}/${t.schemaName}/${t.tableName}`,
        parent: { type: Schema, key: (t) => `${t.dbName}/${t.schemaName}` },
      });

      // Schema.creates can chain with Table (its child)
      const schemaOp = Schema.creates('schema').with(Table.creates('table'));
      expect(schemaOp.children).toHaveLength(1);
      expect(schemaOp.children[0].resourceHandle).toBe(Table);

      // Database.creates can chain with Schema, and Schema can chain with Table
      const dbOp = Database.creates('database').with(
        Schema.creates('schema').with(Table.creates('table')),
      );
      expect(dbOp.children).toHaveLength(1);
      expect(dbOp.children[0].children).toHaveLength(1);
      expect(dbOp.children[0].children[0].resourceHandle).toBe(Table);
    });
  });
});
