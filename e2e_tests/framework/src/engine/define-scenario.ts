import type { ScenarioDefinition, ScenarioHandle } from '../types';

/**
 * Define a business-driven scenario that composes tasks.
 *
 * Scenarios are leaf nodes in the DAG — they compose tasks via t.ensure()
 * and t.perform() but are never composed themselves.
 *
 * @example
 * ```ts
 * defineScenario({
 *   code: 'user-adds-record-to-new-database',
 *   description: 'A new user creates a database and adds their first record',
 *   scenario: async (t) => {
 *     const db = await t.ensure(createDatabase, { ... });
 *     await t.perform(addRecord, { database: db.database, ... });
 *     await t.check('Record persists after refresh', async ({ page }) => { ... });
 *   },
 * });
 * ```
 */
export function defineScenario(def: ScenarioDefinition): ScenarioHandle {
  const handle: ScenarioHandle = {
    code: def.code,
    description: def.description,
    scenarioFn: def.scenario,
  };

  // Scenarios are not registered in the task registry — they're discovered
  // separately and added to the DAG as leaf nodes. Registration happens
  // in the scenario registry (to be added when scenario execution is wired up).

  return handle;
}
