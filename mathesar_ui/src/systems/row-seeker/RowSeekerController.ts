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
  selectionType?: 'single' | 'multiple';
  previousValue?: SummarizedRecordReference | SummarizedRecordReference[];
  constructRecordStore: () => RowSeekerRecordStore;
  addRecordOptions?: {
    text?: string;
    create: (
      searchString?: string,
    ) => Promise<SummarizedRecordReference | null>;
  };
  onSelect?: (
    v: SummarizedRecordReference | SummarizedRecordReference[] | null,
  ) => unknown;
};

export default class RowSeekerController {
  readonly elementId = getGloballyUniqueId();

  readonly selectionType: 'single' | 'multiple';

  readonly previousValue?:
    | SummarizedRecordReference
    | SummarizedRecordReference[];

  records: RowSeekerRecordStore;

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(new Pagination({ size: 200 }));

  select: (
    v: SummarizedRecordReference | SummarizedRecordReference[] | null,
  ) => void = () => {};

  cancel: () => void = () => {};

  canAddNewRecord: boolean;

  private addRecordOptions?: RowSeekerProps['addRecordOptions'];

  private onSelect: RowSeekerProps['onSelect'];

  constructor(props: RowSeekerProps) {
    this.selectionType = props.selectionType ?? 'single';
    this.records = props.constructRecordStore();
    this.addRecordOptions = props.addRecordOptions;
    this.onSelect = props.onSelect;
    this.previousValue = props.previousValue;
    this.canAddNewRecord = !!props.addRecordOptions;
  }

  async focusSearch() {
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
      if (this.selectionType === 'multiple') {
        // For multiple mode, add to existing selection
        const current = Array.isArray(this.previousValue)
          ? this.previousValue
          : this.previousValue
            ? [this.previousValue]
            : [];
        if (value) {
          this.select([...current, value]);
        }
      } else {
        this.select(value);
      }
    }
  }

  async acquireUserSelection(): Promise<
    SummarizedRecordReference | SummarizedRecordReference[] | null
  > {
    return new Promise((resolve, reject) => {
      this.select = async (v) => {
        // Call onSelect callback first and await it if it's async
        if (this.onSelect) {
          try {
            const result = this.onSelect(v);
            // If onSelect returns a promise, await it
            if (result && typeof result === 'object' && 'then' in result) {
              await result;
            }
          } catch (error) {
            console.error('Error in onSelect callback:', error);
            // Don't reject the promise, just log the error
            // The selection should still proceed
          }
        }
        resolve(v);
      };
      this.cancel = () => {
        reject();
      };
    });
  }
}
