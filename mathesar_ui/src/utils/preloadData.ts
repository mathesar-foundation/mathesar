import type { TreeItem } from '@mathesar-components/types';

export interface SchemaEntry {
  id: string,
  name: string
}

export interface Schema extends SchemaEntry, TreeItem {
  tables: SchemaEntry[]
}

interface CommonData {
  databases: string[],
  schemas: Schema[]
}

function getData<T>(selector: string, retainData = false): T {
  const preloadedData: Element = document.querySelector<Element>(selector);
  if (preloadedData?.textContent) {
    try {
      const data = JSON.parse(preloadedData.textContent) as T;
      if (!retainData) {
        preloadedData.remove();
      }
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }
  return null;
}

export function preloadRouteData<T>(routeName: string): T {
  return getData<T>(`#${routeName}`);
}

export function preloadCommonData(): CommonData {
  return getData('#common-data', true);
}
