import type { z } from 'zod';
import type { TestDefinition, TestHandle } from '../types';
import { registry } from '../store/registry';

/**
 * Define a composable test with Zod-typed params and outcomes.
 *
 * Returns a TestHandle that can be:
 * - Used as a reference in t.step() calls within other scenarios
 * - Run standalone if `standalone` config is provided
 *
 * @example
 * ```ts
 * export const login = defineTest({
 *   code: 'login',
 *   params: z.object({ user: z.string(), password: z.string() }),
 *   outcome: z.object({ username: z.string() }),
 *   scenario: async (t, params) => {
 *     const result = await t.action('Log in', loginOutcome, async (page) => {
 *       // ... browser interactions
 *       return { username: params.user };
 *     });
 *     return { username: result.username };
 *   },
 *   standalone: { params: { user: 'admin', password: 'admin' } },
 * });
 * ```
 */
export function defineTest<TParams, TOutcome>(
  def: TestDefinition<TParams, TOutcome>,
): TestHandle<TParams, TOutcome> {
  // Validate standalone params against schema at registration time
  if (def.standalone) {
    const parseResult = def.params.safeParse(def.standalone.params);
    if (!parseResult.success) {
      throw new Error(
        `Standalone params for test '${def.code}' do not match the params schema: ` +
          parseResult.error.message,
      );
    }
  }

  const handle: TestHandle<TParams, TOutcome> = {
    code: def.code,
    paramsSchema: def.params,
    outcomeSchema: def.outcome,
    scenarioFn: def.scenario,
    restoreFn: def.restore,
  };

  registry.register(handle, def.standalone?.params);

  return handle;
}
