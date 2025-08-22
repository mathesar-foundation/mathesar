import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import type {
  RecordsSummaryListResponse,
  SummarizedRecordReference,
} from '@mathesar/api/rpc/_common/commonTypes';
import type AsyncStore from '@mathesar/stores/AsyncStore';
import Pagination from '@mathesar/utils/Pagination';
import { getGloballyUniqueId } from '@mathesar-component-library';

export type RowSeekerRecordStore = AsyncStore<
  {
    limit?: number | null;
    offset?: number | null;
    search?: string | null;
  },
  RecordsSummaryListResponse,
  unknown
>;

export type RowSeekerProps = {
  previousValue?: SummarizedRecordReference;
  constructRecordStore: () => RowSeekerRecordStore;
  addRecordOptions?: {
    text?: string;
    create: (
      searchString?: string,
    ) => Promise<SummarizedRecordReference | null>;
  };
  onSelect?: (v: SummarizedRecordReference | null) => unknown;
};

export default class RowSeekerController {
  readonly elementId = getGloballyUniqueId();

  readonly previousValue?: SummarizedRecordReference;

  records: RowSeekerRecordStore;

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(new Pagination({ size: 200 }));

  select: (v: SummarizedRecordReference | null) => void = () => {};

  cancel: () => void = () => {};

  canAddNewRecord: boolean;

  private addRecordOptions?: RowSeekerProps['addRecordOptions'];

  private onSelect: RowSeekerProps['onSelect'];

  constructor(props: RowSeekerProps) {
    this.records = props.constructRecordStore();
    this.addRecordOptions = props.addRecordOptions;
    this.onSelect = props.onSelect;
    this.previousValue = props.previousValue;
    this.canAddNewRecord = !!props.addRecordOptions;
  }

  private async focusSearch() {
    await tick();
    const rowSeekerComponentElement = document.getElementById(this.elementId);
    const searchBox = rowSeekerComponentElement?.querySelector<HTMLElement>(
      "[data-row-seeker-search] input[type='text'][data-row-seeker-search-box]",
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
      const value = await this.addRecordOptions.create(get(this.searchValue));
      this.select(value);
    }
  }

  async acquireUserSelection(): Promise<SummarizedRecordReference | null> {
    return new Promise((resolve, reject) => {
      this.select = (v) => {
        resolve(v);
        this.onSelect?.(v);
      };
      this.cancel = () => {
        reject();
      };
    });
  }
}
