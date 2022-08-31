export interface RecordSelection {
  type: 'record';
  index: number;
}

export interface GhostSelection {
  type: 'ghost';
}

export type RecordSelectorSelection = RecordSelection | GhostSelection;

export interface SelectionDetails {
  selection: RecordSelectorSelection;
  resultCount: number;
  hasGhostRow: boolean;
  userHasManuallySelectedGhostRow: boolean;
}

/**
 * - 'button' - each row is a button that submits the recordId via a Promise.
 * - 'hyperlink' - each row is a hyperlink to a Record Page.
 */
export type RecordSelectorRowType = 'button' | 'hyperlink';
