import type { TestContext, RequirementHandle } from '../types';
import type { OutcomeStore } from './outcome-store';

export function createContext(store: OutcomeStore): TestContext {
  return {
    get<T>(handle: RequirementHandle<T>): T {
      const data = store.get(handle.outcomeCode);
      if (data === undefined) {
        throw new Error(
          `Outcome '${handle.outcomeCode}' not found. ` +
            `Was it declared as a requirement?`,
        );
      }
      return data as T;
    },
  };
}
