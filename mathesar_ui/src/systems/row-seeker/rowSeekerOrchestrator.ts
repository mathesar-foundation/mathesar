import { get } from 'svelte/store';

import type {
  RecordSelectionOrchestrator,
  RecordSelectionOrchestratorFactory,
} from '../record-selection-orchestrator/RecordSelectionOrchestrator';

import {
  type AttachableRowSeekerController,
  rowSeekerContext,
} from './AttachableRowSeekerController';
import type { RowSeekerProps } from './RowSeekerController';

/**
 * An adapter to make an AttachableRowSeekerController work as a
 * RecordSelectionOrchestrator
 */
function makeRowSeekerOrchestrator({
  constructRecordStore,
  rowSeeker,
}: {
  constructRecordStore: RowSeekerProps['constructRecordStore'];
  rowSeeker: AttachableRowSeekerController;
}): RecordSelectionOrchestrator {
  return {
    launch: ({ previousValue, triggerElement }) =>
      rowSeeker.acquireUserSelection({
        previousValue,
        constructRecordStore,
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
  constructRecordStore,
}: {
  constructRecordStore: RowSeekerProps['constructRecordStore'];
}): RecordSelectionOrchestratorFactory {
  return () => {
    const rowSeeker = rowSeekerContext.getOrError();
    return makeRowSeekerOrchestrator({ constructRecordStore, rowSeeker });
  };
}
