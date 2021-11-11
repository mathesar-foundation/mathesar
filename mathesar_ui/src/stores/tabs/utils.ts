import { router } from 'tinro';
import type {
  Database, DBObjectEntry, SchemaEntry, TabularType,
} from '@mathesar/App';
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
