import { tick } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import Pagination from '@mathesar/utils/Pagination';
import { getGloballyUniqueId } from '@mathesar-component-library';

export interface RowSeekerProps {
  formToken: string;
  fieldKey: string;
  previousValue?: SummarizedRecordReference;
}

export default class RowSeekerController {
  private readonly form_token: string;

  private readonly field_key: string;

  readonly elementId = getGloballyUniqueId();

  readonly previousValue?: SummarizedRecordReference;

  records = new AsyncRpcApiStore(api.forms.list_related_records);

  searchValue: Writable<string> = writable('');

  pagination: Writable<Pagination> = writable(new Pagination({ size: 200 }));

  select: (v: SummarizedRecordReference) => void = () => {};

  constructor(props: RowSeekerProps) {
    this.form_token = props.formToken;
    this.field_key = props.fieldKey;
    this.previousValue = props.previousValue;
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
      form_token: this.form_token,
      field_key: this.field_key,
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

  async acquireUserSelection(): Promise<SummarizedRecordReference | undefined> {
    return new Promise((resolve) => {
      this.select = (v) => {
        resolve(v);
      };
    });
  }
}
