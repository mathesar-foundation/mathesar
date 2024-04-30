import type { SchemaResponse, AbstractTypeResponse } from '@mathesar/AppTypes';
import type { TableEntry } from '@mathesar/api/rest/types/tables';
import type { QueryInstance } from '@mathesar/api/rest/types/queries';
import type { Connection } from '@mathesar/api/rest/connections';
import type { User } from '@mathesar/api/rest/users';

export interface CommonData {
  connections: Connection[];
  schemas: SchemaResponse[];
  tables: TableEntry[];
  queries: QueryInstance[];
  current_connection: Connection['id'] | null;
  internal_db_connection: {
    database: Connection['database'];
    host: Connection['host'];
    port: Connection['port'];
    type: string;
    user: string;
  };
  current_schema: number | null;
  abstract_types: AbstractTypeResponse[];
  user: User;
  current_release_tag_name: string;
  supported_languages: Record<string, string>;
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

export function preloadCommonData(): CommonData {
  const commonData = getData<CommonData>('#common-data');
  if (!commonData) {
    throw new Error('commonData is undefined. This state should never occur');
  }
  return commonData;
}
