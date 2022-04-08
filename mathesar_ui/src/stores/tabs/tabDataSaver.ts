import { router } from 'tinro';
import type { DBObjectEntry, Database, SchemaEntry } from '@mathesar/AppTypes';
import type { TabularType } from '@mathesar/stores/table-data';
import Url64 from '@mathesar/utils/Url64';
import {
  makeTabularDataProps,
  makeTerseTabularDataProps,
} from '@mathesar/stores/table-data';
import type {
  TabularDataProps,
  TerseTabularDataProps,
} from '@mathesar/stores/table-data/types';
import type { TabularTab } from './tabList';

const TAB_LIST_QUERY_PARAM = 't';

export type TabularTabReference = Pick<TabularDataProps, 'type' | 'id'>;

/** [ type, id ] */
type TerseTabularTabReference = [TabularType, DBObjectEntry['id']];

function makeTabularTabReference(
  t: TerseTabularTabReference,
): TabularTabReference {
  return {
    type: t[0],
    id: t[1],
  };
}

function makeTerseTabularTabReference(
  p: TabularTabReference,
): TerseTabularTabReference {
  return [p.type, p.id];
}

export function tabMatchesReference(
  tab: TabularTab,
  ref: TabularTabReference,
): boolean {
  const { tabularData } = tab;
  return tabularData.type === ref.type && tabularData.id === ref.id;
}

export interface SavableTabData {
  tabs: TabularDataProps[];
  activeTab?: TabularTabReference;
}

/** [ tabs, activeTab ] */
type TerseSavableTabData = [
  TerseTabularDataProps[],
  // using null instead of undefined for JSON serialization compatibility
  TerseTabularTabReference | null,
];

function makeSavableTabData(t: TerseSavableTabData): SavableTabData {
  return {
    tabs: t[0].map(makeTabularDataProps),
    activeTab: t[1] ? makeTabularTabReference(t[1]) : undefined,
  };
}

function makeTerseSavableTabData(l: SavableTabData): TerseSavableTabData {
  return [
    l.tabs.map(makeTerseTabularDataProps),
    // using null instead of undefined for JSON serialization compatibility
    l.activeTab ? makeTerseTabularTabReference(l.activeTab) : null,
  ];
}

export function serializeSavableTabData(data: SavableTabData): string {
  return Url64.encode(JSON.stringify(makeTerseSavableTabData(data)));
}

/** @throws {Error} if input string is not formatted correctly */
export function deserializeSavableTabData(s: string): SavableTabData {
  return makeSavableTabData(JSON.parse(Url64.decode(s)));
}

export function saveTabData(data: SavableTabData): void {
  const serializedData = serializeSavableTabData(data);
  router.location.query.set(TAB_LIST_QUERY_PARAM, serializedData);
  // TODO save to localStorage too
}

export function getSavedTabData(): SavableTabData | undefined {
  // TODO load from localStorage as fallback
  let data: SavableTabData | undefined;
  const dataFromUrl = router.location.query.get(TAB_LIST_QUERY_PARAM) as string;
  if (!dataFromUrl) {
    return undefined;
  }
  try {
    data = deserializeSavableTabData(dataFromUrl);
  } catch (e) {
    console.error('Unable to deserialize saved tab data.', e);
  }
  return data;
}

export function constructTabularTabLink(
  db: Database['name'],
  schemaId: SchemaEntry['id'],
  type: TabularType,
  tabularId: DBObjectEntry['id'],
): string {
  const data: SavableTabData = {
    tabs: [{ type, id: tabularId }],
  };
  const serializedData = serializeSavableTabData(data);
  return `/${db}/${schemaId}/?${TAB_LIST_QUERY_PARAM}=${serializedData}`;
}
