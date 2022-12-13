import {
  derived,
  writable,
  get,
  type Readable,
  type Writable,
} from 'svelte/store';
import type { Tab } from '@mathesar-component-library/types';
import type QueryModel from './QueryModel';

const generalTabs: Tab[] = [
  { id: 'inspect-column', label: 'Column' },
  { id: 'inspect-cell', label: 'Cell' },
];
const tabsWhenQueryIsSaved: Tab[] = [
  { id: 'inspect-exploration', label: 'Exploration' },
  ...generalTabs,
];

export default class QueryInspector {
  tabs: Readable<Tab[]>;

  activeTab: Writable<Tab | undefined>;

  constructor(query: Writable<QueryModel>) {
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
