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
