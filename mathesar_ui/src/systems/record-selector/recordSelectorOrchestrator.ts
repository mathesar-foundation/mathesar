import { get } from 'svelte/store';

import type {
  RecordSelectionOrchestrator,
  RecordSelectionOrchestratorFactory,
} from '../record-selection-orchestrator/RecordSelectionOrchestrator';

import {
  type RecordSelectorController,
  recordSelectorContext,
} from './RecordSelectorController';

/**
 * An adapter to make a RecordSelectorController work as a
 * RecordSelectorOrchestrator
 */
function makeRecordSelectorOrchestrator({
  tableOid,
  recordSelector,
}: {
  tableOid: number;
  recordSelector: RecordSelectorController;
}): RecordSelectionOrchestrator {
  return {
    launch: async () => {
      const result = await recordSelector.acquireUserInput({ tableOid });
      return {
        key: result.recordId,
        summary: result.recordSummary,
      };
    },
    close: () => recordSelector.cancel(),
    isOpen: () => get(recordSelector.isOpen),
  };
}

/**
 * @see RecordSelectionOrchestratorFactory to learn why this factory is
 * necessary
 */
export function makeRecordSelectorOrchestratorFactory({
  tableOid,
}: {
  tableOid: number;
}): RecordSelectionOrchestratorFactory {
  return () => {
    const recordSelector = recordSelectorContext.getOrError();
    return makeRecordSelectorOrchestrator({ recordSelector, tableOid });
  };
}
