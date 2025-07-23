import { get } from 'svelte/store';

import type { RecordSelectionOrchestrator } from '../record-selection-orchestrator/RecordSelectionOrchestrator';

import { recordSelectorContext } from './RecordSelectorController';

/**
 * An adapter to make a RecordSelectorController work as a
 * RecordSelectorOrchestrator
 */
export function makeRecordSelectorOrchestrator({
  tableOid,
}: {
  tableOid: number;
}): RecordSelectionOrchestrator {
  function getRecordSelector() {
    const recordSelector = recordSelectorContext.get();
    if (!recordSelector) {
      throw new Error('Record selector not found in context');
    }
    return recordSelector;
  }

  return {
    launch: async () => {
      const result = await getRecordSelector().acquireUserInput({ tableOid });
      if (!result) return undefined;
      return {
        key: result.recordId,
        summary: result.recordSummary,
      };
    },
    close: () => getRecordSelector().cancel(),
    isOpen: () => get(getRecordSelector().isOpen),
  };
}
