import type {
  ResourceDefinition,
  ResourceHandle,
  ResourceOp,
  ResourceOpType,
} from '../types';

/**
 * Create a ResourceOp object with .with() chaining support.
 */
function createResourceOp(
  resourceHandle: ResourceHandle<any>,
  op: ResourceOpType,
  field: string,
  children: ResourceOp[] = [],
): ResourceOp {
  return {
    resourceHandle,
    op,
    field,
    children,
    with(childOp: ResourceOp): ResourceOp {
      const childHandle = childOp.resourceHandle;

      // Validate: child's resource must declare this resource as its parent
      if (!childHandle.parent || childHandle.parent.type !== resourceHandle) {
        throw new Error(
          `Resource '${childHandle.type}' is not a child of '${resourceHandle.type}'. ` +
            `The .with() method only accepts child resource types defined ` +
            `in the nesting hierarchy.`,
        );
      }

      return createResourceOp(resourceHandle, op, field, [...children, childOp]);
    },
  };
}

/**
 * Define a resource type with a Zod schema, key function, and optional parent nesting.
 *
 * Resources are declarative state types — they have no create/cleanup logic.
 * Tasks operate on resources via t.action() declarations.
 *
 * @example
 * ```ts
 * const Database = defineResource({
 *   type: 'database',
 *   schema: z.object({ name: z.string(), displayName: z.string() }),
 *   key: (db) => db.name,
 * });
 *
 * const Schema = defineResource({
 *   type: 'schema',
 *   schema: z.object({ dbName: z.string(), schemaName: z.string() }),
 *   key: (s) => `${s.dbName}/${s.schemaName}`,
 *   parent: { type: Database, key: (s) => s.dbName },
 * });
 * ```
 */
export function defineResource<TState>(
  def: ResourceDefinition<TState>,
): ResourceHandle<TState> {
  const handle: ResourceHandle<TState> = {
    type: def.type,
    schema: def.schema,
    key: def.key,
    parent: def.parent
      ? { type: def.parent.type, key: def.parent.key }
      : undefined,

    creates(field: string): ResourceOp {
      return createResourceOp(handle as ResourceHandle<any>, 'create', field);
    },

    updates(field: string): ResourceOp {
      return createResourceOp(handle as ResourceHandle<any>, 'update', field);
    },

    deletes(field: string): ResourceOp {
      return createResourceOp(handle as ResourceHandle<any>, 'delete', field);
    },
  };

  return handle;
}
