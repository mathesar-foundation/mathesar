import { router } from 'tinro';
import type {
  Database, DBObjectEntry, SchemaEntry, TabularType,
} from '@mathesar/App.d';
import type { TabularDataParams } from '@mathesar/stores/table-data/types';

export interface TabListConfig {
  tabularDataParamList?: TabularDataParams[],
  activeTabularTab?: [
    TabularType,
    DBObjectEntry['id'],
  ]
}

const TAB_QUERY_PARAM = 't';
const ACTIVE_TAB_QUERY_PARAM = 'a';

function isInPath(db: Database['name'], schemaId: SchemaEntry['id']): boolean {
  const paths = window.location.pathname.split('/');
  const dbParam = paths[1];
  const schemaParam = paths[2];

  return dbParam === db && schemaParam === schemaId.toString();
}

export function parseTabListConfigFromURL(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
): TabListConfig {
  let tabularDataParamList: TabListConfig['tabularDataParamList'];
  let activeTabularTab: TabListConfig['activeTabularTab'];

  if (isInPath(db, schemaId)) {
    const params = router.location.query.get() as Record<string, string>;
    const t = params[TAB_QUERY_PARAM];
    const a = params[ACTIVE_TAB_QUERY_PARAM];

    try {
      if (t) {
        tabularDataParamList = JSON.parse(
          decodeURIComponent(t),
        ) as TabListConfig['tabularDataParamList'];
      }
      if (a) {
        activeTabularTab = JSON.parse(
          decodeURIComponent(a),
        ) as TabListConfig['activeTabularTab'];
      }
    } catch (err) {
      console.error('Unable to parse tabular params from url', err);
    }
  }

  return {
    tabularDataParamList,
    activeTabularTab,
  };
}

export function syncTabularParamListToURL(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
  tabularDataParamList: TabListConfig['tabularDataParamList'],
): void {
  if (isInPath(db, schemaId)) {
    try {
      const queryParam = encodeURIComponent(JSON.stringify(tabularDataParamList));
      router.location.query.set(TAB_QUERY_PARAM, queryParam);
    } catch (err) {
      console.error('Unable to set tabular params in url', err);
    }
  }
}

export function syncSingleTabularParamToURL(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
  tabularDataParam: TabularDataParams,
): void {
  if (isInPath(db, schemaId)) {
    try {
      const { tabularDataParamList } = parseTabListConfigFromURL(db, schemaId);
      const replacementIndex = tabularDataParamList.findIndex(
        (entry) => entry[0] === tabularDataParam[0] && entry[1] === tabularDataParam[1],
      );
      if (replacementIndex > -1) {
        tabularDataParamList[replacementIndex] = tabularDataParam;
      }
      syncTabularParamListToURL(db, schemaId, tabularDataParamList);
    } catch (err) {
      console.error('Unable to set single tabular param in url', err);
    }
  }
}

export function syncActiveTabToURL(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
  activeTabularTab?: TabListConfig['activeTabularTab'],
): void {
  if (isInPath(db, schemaId)) {
    try {
      if (activeTabularTab) {
        router.location.query.set(
          ACTIVE_TAB_QUERY_PARAM,
          encodeURIComponent(JSON.stringify(activeTabularTab)),
        );
      } else {
        router.location.query.delete(ACTIVE_TAB_QUERY_PARAM);
      }
    } catch (err) {
      console.error('Unable to set active tabular tab param in url', err);
    }
  }
}

export function constructTabularTabLink(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
  type: TabularType,
  tabularId: DBObjectEntry['id'],
): string {
  const tab = [type, tabularId];
  const active = encodeURIComponent(JSON.stringify(tab));
  const list = encodeURIComponent(JSON.stringify([tab]));
  return `/${db}/${schemaId}/?${TAB_QUERY_PARAM}=${list}&${ACTIVE_TAB_QUERY_PARAM}=${active}`;
}
