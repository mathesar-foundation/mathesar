import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';

/**
 * A polymorphic interface to be implemented by various systems that allow
 * selecting a record from a table (e.g. the Record Selector, the Row Seeker,
 * etc.).
 *
 * This interface exists so that FK input systems such as our LinkedRecordInput
 * can acquire a user-selected record without being coupled directly to the
 * specific record-selection system. This polymorphism allows those FK input
 * systems to be compatible with different record selection systems via thin
 * adapters.
 */
export interface RecordSelectionOrchestrator {
  launch: ({
    previousValue,
    triggerElement,
  }: {
    previousValue?: SummarizedRecordReference;
    triggerElement?: HTMLElement;
  }) => Promise<SummarizedRecordReference | null>;
  close: () => void;
  isOpen: () => boolean;
}

/**
 * This type exists because the various adapters which implement
 * `RecordSelectionOrchestrator` need access to Svelte's context system in order
 * to initialize. They need to access context in order to grab the
 * `RecordSelectorController` or `AttachableRowSeekerController`, which are
 * passed down via context.
 *
 * We can't access the context system outside of the component initialization
 * lifecycle, but we need to construct something _like_ a
 * `RecordSelectionOrchestrator` outside of the component initialization
 * lifecycle (when building a `ProcessedColumn`, for example). So we create one
 * of these `RecordSelectionOrchestratorFactory` functions. Then we pass _that_
 * into `LinkedRecordInput` where it gets called from within the initialization
 * of the specific input, thus having access to context.
 *
 * Would it be better to pass the controllers down via props? I tried that, and
 * it just got _super_ messy!
 *
 * Would it be better to pass the controllers around via a global store? For the
 * record selector, this doesn't work because of the nested record selectors.
 * Context works quite well for that.
 */
export type RecordSelectionOrchestratorFactory =
  () => RecordSelectionOrchestrator;
