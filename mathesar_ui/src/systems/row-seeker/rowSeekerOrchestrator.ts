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

interface RowSeekerOrchestratorProps
  extends Omit<RowSeekerProps, 'previousValue'> {
  rowSeeker: AttachableRowSeekerController;
}

/**
 * An adapter to make an AttachableRowSeekerController work as a
 * RecordSelectionOrchestrator
 */
function makeRowSeekerOrchestrator(
  props: RowSeekerOrchestratorProps,
): RecordSelectionOrchestrator {
  const { rowSeeker, ...rowSeekerProps } = props;
  return {
    launch: ({ previousValue, triggerElement }) =>
      rowSeeker.acquireUserSelection({
        ...rowSeekerProps,
        previousValue,
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
export function makeRowSeekerOrchestratorFactory(
  props: Omit<RowSeekerProps, 'previousValue'>,
): RecordSelectionOrchestratorFactory {
  return () => {
    const rowSeeker = rowSeekerContext.getOrError();
    return makeRowSeekerOrchestrator({
      ...props,
      rowSeeker,
    });
  };
}
