import type { TaskDefinition, TaskHandle } from '../types';
import { registry } from '../store/registry';

/**
 * Define a composable task with Zod-typed params and outcomes.
 *
 * Tasks are the primary building blocks of the Screenwriter framework.
 * They replace defineTest() and add:
 * - Dual execution paths: manual (browser) and programmatic (fast)
 * - Resource-aware actions via t.action({ resource: ... })
 * - Two invocation intents: t.ensure() (resource-centric) and t.perform() (task-centric)
 *
 * @example
 * ```ts
 * export const createDatabase = defineTask({
 *   code: 'create-database',
 *   params: z.object({ dbName: z.string() }),
 *   outcome: z.object({ database: Database.schema }),
 *   task: async (t, params) => {
 *     await t.ensure(login, params.login);
 *     const result = await t.action('Create database', {
 *       schema: z.object({ database: Database.schema }),
 *       resource: Database.creates('database'),
 *       fn: async ({ page }) => { ... },
 *     });
 *     return result;
 *   },
 *   programmatic: async (params) => { ... },
 *   standalone: { params: { dbName: 'Movies' } },
 * });
 * ```
 */
export function defineTask<TParams, TOutcome>(
  def: TaskDefinition<TParams, TOutcome>,
): TaskHandle<TParams, TOutcome> {
  // Validate standalone params against schema at registration time
  if (def.standalone) {
    const parseResult = def.params.safeParse(def.standalone.params);
    if (!parseResult.success) {
      throw new Error(
        `Standalone params for task '${def.code}' do not match the params schema: ` +
          parseResult.error.message,
      );
    }
  }

  const handle: TaskHandle<TParams, TOutcome> = {
    code: def.code,
    paramsSchema: def.params,
    outcomeSchema: def.outcome,
    taskFn: def.task,
    programmaticFn: def.programmatic,
    restoreFn: def.restore,
  };

  registry.register(handle, def.standalone?.params);

  return handle;
}
