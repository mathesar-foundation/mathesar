import { writable } from 'svelte/store';

import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { Result as ApiRecord } from '@mathesar/api/rpc/records';
import { makeContext } from '@mathesar/contexts/utils';

import type { RecordSelectorPurpose } from './recordSelectorUtils';

interface RecordSelectorControllerProps {
  onOpen?: () => void;
  onClose?: () => void;
  nestingLevel: number;
}

type FkCellValue = string | number;

export interface RecordSelectorResult {
  recordId: FkCellValue;
  recordSummary: string;
  record: ApiRecord;
}

export class RecordSelectorController {
  private onOpen: () => void;

  private onClose: () => void;

  /** 0 = root level */
  nestingLevel: number;

  purpose = writable<RecordSelectorPurpose>('dataEntry');

  isOpen = writable(false);

  submit: (v: RecordSelectorResult) => void = () => {};

  cancel: () => void = () => {};

  tableOid = writable<number | undefined>(undefined);

  columnWithNestedSelectorOpen = writable<RawColumnWithMetadata | undefined>(
    undefined,
  );

  constructor(props: RecordSelectorControllerProps) {
    this.onOpen = props.onOpen ?? (() => {});
    this.onClose = props.onClose ?? (() => {});
    this.nestingLevel = props.nestingLevel;
  }

  private open(): void {
    this.isOpen.set(true);
    this.onOpen();
  }

  private close(): void {
    this.submit = () => {};
    this.cancel = () => {};
    this.isOpen.set(false);
    this.onClose();
  }

  acquireUserInput({
    tableOid,
  }: {
    tableOid: number;
  }): Promise<RecordSelectorResult | undefined> {
    this.tableOid.set(tableOid);
    this.purpose.set('dataEntry');
    this.open();
    return new Promise((resolve) => {
      this.submit = (v) => {
        resolve(v);
        this.close();
      };
      this.cancel = () => {
        resolve(undefined);
        this.close();
      };
    });
  }

  navigateToRecordPage({ tableOid }: { tableOid: number }): void {
    this.tableOid.set(tableOid);
    this.purpose.set('navigation');
    this.open();
    this.cancel = () => {
      this.close();
    };
  }
}

export const recordSelectorContext = makeContext<RecordSelectorController>();
