import { describe, it, expect } from 'vitest';
import { defineScenario } from '../engine/define-scenario';

describe('defineScenario', () => {
  it('returns a ScenarioHandle with correct code, description, and function', () => {
    const scenarioFn = async (t: any) => {};

    const handle = defineScenario({
      code: 'user-adds-record',
      description: 'A user creates a database and adds a record',
      scenario: scenarioFn,
    });

    expect(handle.code).toBe('user-adds-record');
    expect(handle.description).toBe(
      'A user creates a database and adds a record',
    );
    expect(handle.scenarioFn).toBe(scenarioFn);
  });
});
