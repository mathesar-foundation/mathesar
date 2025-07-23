import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';

/**
 * A polymorphic interface to be implemented by various systems that allow
 * selecting a record from a table (e.g. the Record Selector, the Row Seeker,
 * etc.).
 */
export interface RecordSelectionOrchestrator {
  launch: ({
    previousValue,
    triggerElement,
  }: {
    previousValue?: SummarizedRecordReference;
    triggerElement?: HTMLElement;
  }) => Promise<SummarizedRecordReference | undefined>;
  close: () => void;
  isOpen: () => boolean;
}
