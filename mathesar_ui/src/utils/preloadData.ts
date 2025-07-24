import type { RawDatabase } from '@mathesar/api/rpc/databases';
import type { SavedExploration } from '@mathesar/api/rpc/explorations';
import type { RawSchema } from '@mathesar/api/rpc/schemas';
import type { RawServer } from '@mathesar/api/rpc/servers';
import type { RawTableWithMetadata } from '@mathesar/api/rpc/tables';
import type { User } from '@mathesar/api/rpc/users';

type WithStatus<D> =
  | {
      state: 'success';
      data: D;
    }
  | {
      state: 'failure';
      error: {
        code: number;
        message: string;
      };
    };

export interface BaseCommonData {
  current_release_tag_name: string;
  supported_languages: Record<string, string>;
  is_authenticated: boolean;
}

export interface AuthenticatedCommonData extends BaseCommonData {
  databases: RawDatabase[];
  servers: RawServer[];
  schemas: WithStatus<RawSchema[]>;
  tables: WithStatus<RawTableWithMetadata[]>;
  queries: SavedExploration[];
  current_database: RawDatabase['id'] | null;
  internal_db: {
    database_name: string;
    host: string;
    port: number;
    type: string;
  };
  current_schema: number | null;
  user: User;
  routing_context: 'normal';
}

export interface AnonymousCommonData extends BaseCommonData {
  routing_context: 'anonymous';
}

export type CommonData = AuthenticatedCommonData | AnonymousCommonData;

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

export function getAuthenticatedCommonData(): AuthenticatedCommonData {
  const commonData = preloadCommonData();
  if (commonData.routing_context === 'anonymous') {
    throw new Error(
      'Authenticated commonData is requested within an anonymous routing context',
    );
  }
  return commonData;
}
