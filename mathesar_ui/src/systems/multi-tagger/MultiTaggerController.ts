import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import type {
  RecordsSummaryListResponse,
  SummarizedRecordReference,
} from '@mathesar/api/rpc/_common/commonTypes';
import type AsyncStore from '@mathesar/stores/AsyncStore';
import Pagination from '@mathesar/utils/Pagination';
import { getGloballyUniqueId } from '@mathesar-component-library';

export type MultiTaggerRecordStore = AsyncStore<
  {
    limit?: number | null;
    offset?: number | null;
    search?: string | null;
  },
  RecordsSummaryListResponse,
  unknown
>;

export type MultiTaggerProps = {
  constructRecordStore: () => MultiTaggerRecordStore;
  addRecordOptions?: {
    text?: string;
    create: (
      searchString?: string,
    ) => Promise<SummarizedRecordReference | null>;
  };
};

export default class MultiTaggerController {
  readonly elementId = getGloballyUniqueId();

  records: MultiTaggerRecordStore;

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(new Pagination({ size: 200 }));

  cancel: () => void = () => {};

  readonly canAddNewRecord: boolean;

  private addRecordOptions?: MultiTaggerProps['addRecordOptions'];

  constructor(props: MultiTaggerProps) {
    this.records = props.constructRecordStore();
    this.addRecordOptions = props.addRecordOptions;
    this.canAddNewRecord = !!props.addRecordOptions;
  }

  async focusSearch() {
    await tick();
    const componentElement = document.getElementById(this.elementId);
    const searchBox = componentElement?.querySelector<HTMLElement>(
      "[data-multi-tagger-search] input[type='text'][data-multi-tagger-search-box]",
    );
    searchBox?.focus?.();
  }

  async getRecords() {
    const pagination = get(this.pagination);
    await this.records.run({
      ...pagination.recordsRequestParams(),
      search: get(this.searchValue) || null,
    });
    await this.focusSearch();
  }

  async resetPaginationAndGetRecords() {
    this.pagination.set(new Pagination({ size: 200, page: 1 }));
    await this.getRecords();
  }

  async getReady() {
    await this.focusSearch();
    await this.getRecords();
  }

  clearRecords() {
    this.records.reset();
    this.searchValue.set('');
  }

  async addNewRecord() {
    if (this.addRecordOptions) {
      throw new Error('Not implemented');
    }
  }

  async acquireUserSelection(): Promise<SummarizedRecordReference | null> {
    return new Promise((resolve, reject) => {
      this.cancel = () => {
        reject();
      };
    });
  }
}
