import type { RegisteredTest } from '../types';

class TestRegistry {
  private tests = new Map<string, RegisteredTest>();

  register(test: RegisteredTest): void {
    const existing = this.tests.get(test.outcomeCode);
    if (existing) {
      if (existing.testCode !== test.testCode) {
        throw new Error(
          `Duplicate outcome code '${test.outcomeCode}' registered by ` +
            `test '${test.testCode}', but already registered by test ` +
            `'${existing.testCode}'. Each outcome code must be unique.`,
        );
      }
      return;
    }
    this.tests.set(test.outcomeCode, test);
  }

  get(outcomeCode: string): RegisteredTest | undefined {
    return this.tests.get(outcomeCode);
  }

  getStandaloneByCode(testCode: string): RegisteredTest | undefined {
    for (const test of this.tests.values()) {
      if (test.testCode === testCode && test.isStandalone) {
        return test;
      }
    }
    return undefined;
  }

  getAll(): RegisteredTest[] {
    return Array.from(this.tests.values());
  }

  has(outcomeCode: string): boolean {
    return this.tests.has(outcomeCode);
  }
}

export const registry = new TestRegistry();
