import type {
  SchemaResponse,
  AbstractTypeResponse,
  Database,
} from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/types/tables';
import type { QueryInstance } from '@mathesar/api/types/queries';
import type { User } from '@mathesar/api/users';

export interface CommonData {
  databases: Database[];
  schemas: SchemaResponse[];
  tables: TableEntry[];
  queries: QueryInstance[];
  current_db: string;
  current_schema: number | null;
  abstract_types: AbstractTypeResponse[];
  user: User;
  live_demo_mode: boolean;
  current_release_tag_name: string;
  is_authenticated: boolean;
  routing_context: 'normal' | 'anonymous';
}

function getData<T>(selector: string): T | undefined {
  const preloadedData = document.querySelector<Element>(selector);
  if (!preloadedData?.textContent) {
    return undefined;
  }
  try {
    const data = JSON.parse(preloadedData.textContent) as T;
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
  return getData('#common-data');
}
