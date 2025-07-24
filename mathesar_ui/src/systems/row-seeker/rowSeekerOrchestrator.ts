import { get } from 'svelte/store';

import type {
  RecordSelectionOrchestrator,
  RecordSelectionOrchestratorFactory,
} from '../record-selection-orchestrator/RecordSelectionOrchestrator';

import {
  type AttachableRowSeekerController,
  rowSeekerContext,
} from './AttachableRowSeekerController';

/**
 * An adapter to make an AttachableRowSeekerController work as a
 * RecordSelectionOrchestrator
 */
function makeRowSeekerOrchestrator({
  formToken,
  fieldKey,
  rowSeeker,
}: {
  formToken: string;
  fieldKey: string;
  rowSeeker: AttachableRowSeekerController;
}): RecordSelectionOrchestrator {
  return {
    // TODO_4637: utilize previousValue
    launch: async ({ previousValue, triggerElement }) =>
      rowSeeker.acquireUserSelection({
        formToken,
        fieldKey,
        triggerElement: triggerElement ?? document.body,
      }),
    close: () => rowSeeker.close(),
    isOpen: () => !!get(rowSeeker.rowSeeker),
  };
}

/**
 * @see RecordSelectionOrchestratorFactory to learn why this factory is
 * necessary
 */
export function makeRowSeekerOrchestratorFactory({
  formToken,
  fieldKey,
}: {
  formToken: string;
  fieldKey: string;
}): RecordSelectionOrchestratorFactory {
  return () => {
    const rowSeeker = rowSeekerContext.getOrError();
    return makeRowSeekerOrchestrator({ formToken, fieldKey, rowSeeker });
  };
}
