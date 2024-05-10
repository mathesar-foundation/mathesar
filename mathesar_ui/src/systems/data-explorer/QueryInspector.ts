import {
  type Readable,
  type Writable,
  derived,
  get,
  writable,
} from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { Tab } from '@mathesar-component-library/types';

import type QueryModel from './QueryModel';

export default class QueryInspector {
  tabs: Readable<Tab[]>;

  activeTab: Writable<Tab | undefined>;

  constructor(query: Writable<QueryModel>) {
    const generalTabs: Tab[] = [
      { id: 'inspect-column', label: get(_)('column') },
      { id: 'inspect-cell', label: get(_)('cell') },
    ];
    const tabsWhenQueryIsSaved: Tab[] = [
      { id: 'inspect-exploration', label: get(_)('exploration') },
      ...generalTabs,
    ];

    this.tabs = derived(query, ($query) => {
      if ($query.isSaved()) {
        return tabsWhenQueryIsSaved;
      }
      return generalTabs;
    });
    this.activeTab = writable(get(this.tabs)[0]);
  }

  selectColumnTab() {
    this.activeTab.set(
      get(this.tabs).find((tab) => tab.id === 'inspect-column'),
    );
  }

  selectCellTab() {
    this.activeTab.set(get(this.tabs).find((tab) => tab.id === 'inspect-cell'));
  }
}
