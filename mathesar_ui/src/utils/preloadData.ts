import type {
  Database,
  SchemaResponse,
  AbstractTypeResponse,
} from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables/tableList';

interface CommonData {
  databases: Database[];
  schemas: SchemaResponse[];
  tables: TableEntry[];
  current_db: string;
  current_schema: number;
  abstract_types: AbstractTypeResponse[];
}

function getData<T>(selector: string, retainData = false): T | undefined {
  const preloadedData = document.querySelector<Element>(selector);
  if (!preloadedData?.textContent) {
    return undefined;
  }
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
  return undefined;
}

export function preloadRouteData<T>(routeName: string): T | undefined {
  return getData<T>(`#${routeName}`);
}

export function preloadCommonData(): CommonData | undefined {
  return getData('#common-data', true);
}
