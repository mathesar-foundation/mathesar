import { get } from 'svelte/store';

import type { RecordSelectionOrchestrator } from '../record-selection-orchestrator/RecordSelectionOrchestrator';

import { rowSeekerContext } from './AttachableRowSeekerController';

/**
 * An adapter to make an AttachableRowSeekerController work as a
 * RecordSelectionOrchestrator
 */
export function makeRowSeekerOrchestrator({
  formToken,
  fieldKey,
}: {
  formToken: string;
  fieldKey: string;
}): RecordSelectionOrchestrator {
  function getRowSeeker() {
    const rowSeeker = rowSeekerContext.get();
    if (!rowSeeker) throw new Error('Row seeker not found in context');
    return rowSeeker;
  }

  return {
    // TODO_4637: utilize previousValue
    launch: async ({ previousValue, triggerElement }) =>
      getRowSeeker().acquireUserSelection({
        formToken,
        fieldKey,
        triggerElement: triggerElement ?? document.body,
      }),
    close: () => getRowSeeker().close(),
    isOpen: () => get(getRowSeeker().isOpen),
  };
}
