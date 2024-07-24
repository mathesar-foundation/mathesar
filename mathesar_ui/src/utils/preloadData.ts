import type { Connection } from '@mathesar/api/rest/connections';
import type { QueryInstance } from '@mathesar/api/rest/types/queries';
import type { TableEntry } from '@mathesar/api/rest/types/tables';
import type { User } from '@mathesar/api/rest/users';
import type { Database } from '@mathesar/api/rpc/databases';
import type { Schema } from '@mathesar/api/rpc/schemas';
import type { AbstractTypeResponse } from '@mathesar/AppTypes';

export interface CommonData {
  databases: Database[];
  schemas: Schema[];
  tables: TableEntry[];
  queries: QueryInstance[];
  current_database: Database['id'] | null;
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
