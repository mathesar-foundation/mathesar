import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineResource } from '../engine/define-resource';
import { defineTask } from '../engine/define-task';
import { buildTaskDag, computeTaskLevels } from '../engine/task-dag';
import { validateResourceLifecycles } from '../engine/task-dag-validate-resources';
import { registry } from '../store/registry';
import { outcomeStore } from '../store/outcome-store';
import { resourceStore } from '../store/resource-store';
import type { TaskContext } from '../types';

beforeEach(() => {
  registry.clear();
  outcomeStore.clear();
  resourceStore.clear();
});

// --- Shared resource definitions ---

const Database = defineResource({
  type: 'database',
  schema: z.object({ name: z.string() }),
  key: (db) => db.name,
});

const SchemaRes = defineResource({
  type: 'schema',
  schema: z.object({ dbName: z.string(), schemaName: z.string() }),
  key: (s) => `${s.dbName}/${s.schemaName}`,
  parent: { type: Database, key: (s) => s.dbName },
});

const AppUser = defineResource({
  type: 'app-user',
  schema: z.object({ username: z.string() }),
  key: (u) => u.username,
});

describe('validateResourceLifecycles', () => {
  it('passes for task with create then update on same resource type', async () => {
    defineTask({
      code: 'create-then-update',
      params: z.object({}),
      outcome: z.object({ user: AppUser.schema }),
      task: async (t: TaskContext) => {
        const created = await t.action('Create user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.creates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
        await t.action('Update user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.updates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
        return created;
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('fails for task with update without prior create', async () => {
    defineTask({
      code: 'update-no-create',
      params: z.object({}),
      outcome: z.object({ user: AppUser.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Update user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.updates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_update_without_create',
    );
    expect(resourceErrors).toHaveLength(1);
    expect(resourceErrors[0].message).toContain("'app-user'");
    expect(resourceErrors[0].message).toContain('updated');
  });

  it('fails for task with delete without prior create', async () => {
    defineTask({
      code: 'delete-no-create',
      params: z.object({}),
      outcome: z.object({ db: Database.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Delete database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.deletes('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_update_without_create',
    );
    expect(resourceErrors).toHaveLength(1);
    expect(resourceErrors[0].message).toContain("'database'");
    expect(resourceErrors[0].message).toContain('deleted');
  });

  it('passes when ensured sub-task creates the resource before update', async () => {
    const createUser = defineTask({
      code: 'create-user',
      params: z.object({}),
      outcome: z.object({ user: AppUser.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Create user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.creates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
      },
      standalone: { params: {} },
    });

    defineTask({
      code: 'update-after-ensure',
      params: z.object({}),
      outcome: z.object({ user: AppUser.schema }),
      task: async (t: TaskContext) => {
        await t.ensure(createUser, {});
        return await t.action('Update user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.updates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('fails for create after delete', async () => {
    defineTask({
      code: 'create-delete-create',
      params: z.object({}),
      outcome: z.object({ db: Database.schema }),
      task: async (t: TaskContext) => {
        await t.action('Create database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
        await t.action('Delete database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.deletes('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
        return await t.action('Recreate database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_create_after_delete',
    );
    expect(resourceErrors).toHaveLength(1);
    expect(resourceErrors[0].message).toContain("'database'");
    expect(resourceErrors[0].message).toContain('after being deleted');
  });

  it('fails for duplicate perform-creates at same level', async () => {
    const sharedCreate = defineTask({
      code: 'shared-create',
      params: z.object({}),
      outcome: z.object({ db: Database.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Create database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
      },
    });

    defineTask({
      code: 'task-a',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.perform(sharedCreate, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineTask({
      code: 'task-b',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.perform(sharedCreate, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_duplicate_perform_create',
    );
    expect(resourceErrors).toHaveLength(1);
    expect(resourceErrors[0].message).toContain("'database'");
    expect(resourceErrors[0].message).toContain("'task-a'");
    expect(resourceErrors[0].message).toContain("'task-b'");
  });

  it('passes for duplicate ensure-creates at same level (idempotent)', async () => {
    const sharedCreate = defineTask({
      code: 'shared-create-ensure',
      params: z.object({}),
      outcome: z.object({ db: Database.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Create database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
      },
    });

    defineTask({
      code: 'ensure-a',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.ensure(sharedCreate, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineTask({
      code: 'ensure-b',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.ensure(sharedCreate, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_duplicate_perform_create',
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('passes for .with() child create when parent type is created', async () => {
    defineTask({
      code: 'create-with-child',
      params: z.object({}),
      outcome: z.object({
        db: Database.schema,
        schema: SchemaRes.schema,
      }),
      task: async (t: TaskContext) => {
        return await t.action('Create database with schema', {
          schema: z.object({
            db: Database.schema,
            schema: SchemaRes.schema,
          }),
          resource: Database.creates('db').with(SchemaRes.creates('schema')),
          fn: async () => ({
            db: { name: 'test' },
            schema: { dbName: 'test', schemaName: 'public' },
          }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('fails for child create when parent type is not created', async () => {
    defineTask({
      code: 'orphan-child',
      params: z.object({}),
      outcome: z.object({ schema: SchemaRes.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Create orphan schema', {
          schema: z.object({ schema: SchemaRes.schema }),
          resource: SchemaRes.creates('schema'),
          fn: async () => ({
            schema: { dbName: 'test', schemaName: 'public' },
          }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter(
      (e) => e.type === 'resource_missing_parent',
    );
    expect(resourceErrors).toHaveLength(1);
    expect(resourceErrors[0].message).toContain("'schema'");
    expect(resourceErrors[0].message).toContain("'database'");
  });

  it('passes for update that comes after create in step order', async () => {
    defineTask({
      code: 'sequential-create-update',
      params: z.object({}),
      outcome: z.object({ user: AppUser.schema }),
      task: async (t: TaskContext) => {
        await t.action('Create user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.creates('user'),
          fn: async () => ({ user: { username: 'bob' } }),
        });
        await t.check('Verify user created', async () => {});
        return await t.action('Update user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.updates('user'),
          fn: async () => ({ user: { username: 'bob' } }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('tracks multiple resource types independently', async () => {
    defineTask({
      code: 'multi-resource',
      params: z.object({}),
      outcome: z.object({
        db: Database.schema,
        user: AppUser.schema,
      }),
      task: async (t: TaskContext) => {
        // Create database — no prior create needed
        await t.action('Create database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
        // Create user — no prior create needed
        await t.action('Create user', {
          schema: z.object({ user: AppUser.schema }),
          resource: AppUser.creates('user'),
          fn: async () => ({ user: { username: 'alice' } }),
        });
        // Update user — database create should not affect user tracking
        return await t.action('Update user', {
          schema: z.object({
            db: Database.schema,
            user: AppUser.schema,
          }),
          resource: AppUser.updates('user'),
          fn: async () => ({
            db: { name: 'test' },
            user: { username: 'alice' },
          }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });

  it('passes when parent is created by an ensured sub-task', async () => {
    const createDb = defineTask({
      code: 'create-db-for-child',
      params: z.object({}),
      outcome: z.object({ db: Database.schema }),
      task: async (t: TaskContext) => {
        return await t.action('Create database', {
          schema: z.object({ db: Database.schema }),
          resource: Database.creates('db'),
          fn: async () => ({ db: { name: 'test' } }),
        });
      },
    });

    defineTask({
      code: 'create-child-after-ensure',
      params: z.object({}),
      outcome: z.object({ schema: SchemaRes.schema }),
      task: async (t: TaskContext) => {
        await t.ensure(createDb, {});
        return await t.action('Create schema', {
          schema: z.object({ schema: SchemaRes.schema }),
          resource: SchemaRes.creates('schema'),
          fn: async () => ({
            schema: { dbName: 'test', schemaName: 'public' },
          }),
        });
      },
      standalone: { params: {} },
    });

    const dag = await buildTaskDag();
    const resourceErrors = dag.errors.filter((e) =>
      e.type.startsWith('resource_'),
    );
    expect(resourceErrors).toHaveLength(0);
  });
});
