/* eslint-disable max-classes-per-file */
import type {
  Group as ApiGroup,
  Result as ApiRecord,
} from '@mathesar/api/rpc/records';
import { getGloballyUniqueId } from '@mathesar-component-library';

import type { RecordGroup } from './utils';

export enum RowType {
  PersistedRecord = 'persistedRecord',
  DraftRecord = 'draftRecord',
  PlaceholderRecord = 'placeholderRecord',
  GroupHeader = 'groupHeader',
  Help = 'help',
}

/* For rows that manipulate records */
abstract class BaseRecordRow<
  T extends
    | RowType.PersistedRecord
    | RowType.DraftRecord
    | RowType.PlaceholderRecord,
> {
  readonly identifier: string;

  readonly record: ApiRecord;

  readonly type: T;

  protected constructor(props: {
    identifier?: string;
    record: ApiRecord;
    type: T;
  }) {
    this.identifier = props.identifier ?? getGloballyUniqueId('record-row');
    this.record = props.record;
    this.type = props.type;
  }

  /**
   * Returns a new instance of the same row with an updated record.
   */
  abstract withRecord(updatedRecord: ApiRecord): BaseRecordRow<T>;
}

export class PersistedRecordRow extends BaseRecordRow<RowType.PersistedRecord> {
  constructor(props: { identifier?: string; record: ApiRecord }) {
    super({ ...props, type: RowType.PersistedRecord });
  }

  withRecord(updatedRecord: ApiRecord): PersistedRecordRow {
    return new PersistedRecordRow({
      identifier: this.identifier,
      record: updatedRecord,
    });
  }

  static fromDraft(draft: DraftRecordRow): PersistedRecordRow {
    return new PersistedRecordRow({
      identifier: draft.identifier,
      record: draft.record,
    });
  }
}

export class DraftRecordRow extends BaseRecordRow<RowType.DraftRecord> {
  constructor(props: { identifier?: string; record: ApiRecord }) {
    super({
      ...props,
      type: RowType.DraftRecord,
    });
  }

  withRecord(updatedRecord: ApiRecord): DraftRecordRow {
    return new DraftRecordRow({
      identifier: this.identifier,
      record: updatedRecord,
    });
  }

  static fromPlaceholder(placeholder: PlaceholderRecordRow): DraftRecordRow {
    return new DraftRecordRow({
      identifier: placeholder.identifier,
      record: placeholder.record,
    });
  }
}

export class PlaceholderRecordRow extends BaseRecordRow<RowType.PlaceholderRecord> {
  constructor(props: { identifier?: string; record: ApiRecord }) {
    super({
      ...props,
      type: RowType.PlaceholderRecord,
    });
  }

  withRecord(updatedRecord: ApiRecord): PlaceholderRecordRow {
    return new PlaceholderRecordRow({
      identifier: this.identifier,
      record: updatedRecord,
    });
  }
}

export class GroupHeaderRow {
  identifier = getGloballyUniqueId('group-header-row');

  group: RecordGroup;

  groupValues: ApiGroup['results_eq'];

  type = RowType.GroupHeader;

  constructor(props: {
    group: RecordGroup;
    groupValues: ApiGroup['results_eq'];
  }) {
    this.group = props.group;
    this.groupValues = props.groupValues;
  }
}

export class HelpTextRow {
  identifier = getGloballyUniqueId('help-row');

  type = RowType.Help;
}

export type ProvisionalRecordRow = DraftRecordRow | PlaceholderRecordRow;

export type RecordRow = PersistedRecordRow | ProvisionalRecordRow;

export type Row = RecordRow | GroupHeaderRow | HelpTextRow;

export function isPersistedRecordRow(row: Row): row is PersistedRecordRow {
  return row.type === RowType.PersistedRecord;
}

export function isDraftRecordRow(row: Row): row is DraftRecordRow {
  return row.type === RowType.DraftRecord;
}

export function isPlaceholderRecordRow(row: Row): row is PlaceholderRecordRow {
  return row.type === RowType.PlaceholderRecord;
}

export function isProvisionalRecordRow(row: Row): row is ProvisionalRecordRow {
  return isDraftRecordRow(row) || isPlaceholderRecordRow(row);
}

export function isRecordRow(row: Row): row is RecordRow {
  return isProvisionalRecordRow(row) || isPersistedRecordRow(row);
}

export function isGroupHeaderRow(row: Row): row is GroupHeaderRow {
  return row.type === RowType.GroupHeader;
}

export function isHelpTextRow(row: Row): row is HelpTextRow {
  return row.type === RowType.Help;
}

export function filterRecordRows(rows: Row[]): RecordRow[] {
  return rows.filter((row): row is RecordRow => isRecordRow(row));
}

/* eslint-enable max-classes-per-file */
