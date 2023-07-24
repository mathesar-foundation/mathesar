import {
  derived,
  writable,
  get,
  type Readable,
  type Writable,
} from 'svelte/store';
import type { Tab } from '@mathesar-component-library/types';
import { getTranslator } from '@mathesar/i18n/getTranslator';
import type QueryModel from './QueryModel';

const generalTabs: Tab[] = [
  { id: 'inspect-column', label: getTranslator().general.column() },
  { id: 'inspect-cell', label: getTranslator().general.cell() },
];
const tabsWhenQueryIsSaved: Tab[] = [
  {
    id: 'inspect-exploration',
    label: getTranslator().general.exploration(),
  },
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
