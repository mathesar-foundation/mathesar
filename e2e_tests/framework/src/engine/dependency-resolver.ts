import type { RequirementHandle } from '../types';
import { registry } from '../store/registry';
import { outcomeStore } from '../store/outcome-store';
import { createContext } from '../store/test-context';

const resolving = new Set<string>();
const failed = new Map<string, string>();

export function resetResolverState(): void {
  resolving.clear();
  failed.clear();
}

export async function resolveRequirements(
  handles: RequirementHandle[],
): Promise<void> {
  for (const handle of handles) {
    await resolveOne(handle.outcomeCode, []);
  }
}

async function resolveOne(
  outcomeCode: string,
  chain: string[],
): Promise<void> {
  if (outcomeStore.has(outcomeCode)) return;

  const currentChain = [...chain, outcomeCode];

  const priorFailure = failed.get(outcomeCode);
  if (priorFailure) {
    throw new Error(
      `Dependency '${outcomeCode}' failed previously: ${priorFailure}\n` +
        `  Resolution chain: ${currentChain.join(' -> ')}`,
    );
  }

  if (resolving.has(outcomeCode)) {
    throw new Error(
      `Circular dependency detected: ${currentChain.join(' -> ')} -> ${outcomeCode}`,
    );
  }

  const testDef = registry.get(outcomeCode);
  if (!testDef) {
    throw new Error(
      `No test registered for outcome '${outcomeCode}'. ` +
        `Check that the test file is imported and the params match.\n` +
        `  Resolution chain: ${currentChain.join(' -> ')}`,
    );
  }

  resolving.add(outcomeCode);
  try {
    const requirements = testDef.getRequirements();
    for (const req of requirements) {
      await resolveOne(req.outcomeCode, currentChain);
    }

    const context = createContext(outcomeStore);
    const outcomeData = await testDef.runFixture(context);
    outcomeStore.set(outcomeCode, outcomeData);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failed.set(outcomeCode, message);
    if (
      chain.length > 0 &&
      err instanceof Error &&
      !err.message.includes('Resolution chain:')
    ) {
      err.message = `${err.message}\n  Resolution chain: ${currentChain.join(' -> ')}`;
    }
    throw err;
  } finally {
    resolving.delete(outcomeCode);
  }
}
