import type {
  Database,
  SchemaResponse,
  AbstractTypeResponse,
} from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/tables';
import type { QueryInstance } from '@mathesar/api/queries';

interface CommonData {
  databases: Database[];
  schemas: SchemaResponse[];
  tables: TableEntry[];
  queries: QueryInstance[];
  current_db: string;
  current_schema: number | null;
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
    console.error(err);
  }
  return undefined;
}

export function preloadRouteData<T>(routeName: string): T | undefined {
  return getData<T>(`#${routeName}`);
}

export function preloadCommonData(): CommonData | undefined {
  return getData('#common-data', true);
}
