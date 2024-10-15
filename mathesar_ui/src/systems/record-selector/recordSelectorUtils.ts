/**
 * - 'dataEntry' - each row is a button that submits the recordId via a Promise.
 * - 'navigation' - each row is a hyperlink to a Record Page.
 */
export type RecordSelectorPurpose = 'dataEntry' | 'navigation';

/** What kind of row are we in? */
export type CellLayoutRowType = 'columnHeaderRow' | 'dataRow';
/** What kind of column are we in? */
export type CellLayoutColumnType = 'dataColumn' | 'rowHeaderColumn';

export type CellState = 'focused' | 'acquiringFkValue';
