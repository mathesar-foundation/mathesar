import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

import type { Database } from '@mathesar/App.d';
import type { PaginatedResponse } from '@mathesar/utils/api';
import { pair, notEmpty } from '@mathesar/utils/language';
import type { CancellablePromise } from '@mathesar/components';

const commonData = preloadCommonData();

export const currentDBName: Writable<Database['name']> = writable(
  commonData.current_db || null,
);

export interface DatabaseStoreData {
  preload?: boolean,
  state: States,
  data?: Database[],
  error?: string
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  state: States.Loading,
  // TODO an empty list is ambiguous, undefined would be preferable
  data: commonData.databases || [],
});

export const currentDBId: Readable<Database['id']> = derived(
  [currentDBName, databases],
  // eslint-disable-next-line @typescript-eslint/no-shadow
  ([currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const databases = databasesStore.data;
    return notEmpty(databases)
      ? databases.find((database) => database.name === currentDBName).id
      : undefined;
  },
);

let databaseRequest: CancellablePromise<PaginatedResponse<Database>>;

export async function reloadDatabases(): Promise<PaginatedResponse<Database>> {
  databases.update((currentData) => ({
    ...currentData,
    state: States.Loading,
  }));

  try {
    databaseRequest?.cancel();
    databaseRequest = getAPI<PaginatedResponse<Database>>('/databases/?limit=500');
    const response = await databaseRequest;
    const data = response.results || [];
    databases.set({
      state: States.Done,
      data,
    });
    return response;
  } catch (err) {
    databases.set({
      state: States.Error,
      error: err instanceof Error ? err.message : null,
    });
    return null;
  }
}

export type DbType = string;

export interface MathesarType {
  name: string,
  identifier: string,
  db_types: DbType[]
}

export function determineMathesarType(
  // eslint-disable-next-line @typescript-eslint/no-shadow
  mathesarTypes: MathesarType[],
  dbType: DbType,
): MathesarType {
  const mathesarTypeHasItAsTarget = (mt: MathesarType) => mt.db_types.includes(dbType);
  return mathesarTypes.find(mathesarTypeHasItAsTarget);
}

// eslint-disable-next-line @typescript-eslint/no-shadow
export function getMathesarTypeIcon(mathesarType: MathesarType): string {
  switch (mathesarType.identifier) {
    case 'number':
      return '#';
    case 'text':
      return 'T';
    default:
      return '?';
  }
}

export type DatabasesToMathesarTypes = Map<Database['id'], MathesarType[]>;

async function getDatabasesToMathesarTypes(
  knownDatabases: Database[],
):Promise<DatabasesToMathesarTypes> {
  function getMathesarTypesForDatabase(db: Database) {
    return getAPI<MathesarType[]>(`/databases/${db.id}/types`);
  }

  const promisesOfPairs = knownDatabases.map(
    async (db) => pair(db.id, await getMathesarTypesForDatabase(db)),
  );

  const toMap = <A, B>(pairs: [A, B][]) => new Map<A, B>(pairs);

  return Promise.all(promisesOfPairs).then(toMap);
}

// eslint-disable-next-line operator-linebreak
export const databasesToMathesarTypesStore: Readable<DatabasesToMathesarTypes> =
  derived<Readable<DatabaseStoreData>, DatabasesToMathesarTypes>(
    databases,
    ($databaseStoreData, set) => {
      const knownDatabases = $databaseStoreData.data;
      if (knownDatabases && notEmpty(knownDatabases)) {
        void getDatabasesToMathesarTypes(knownDatabases).then(set);
      }
    },
    undefined,
  );

// eslint-disable-next-line operator-linebreak
export const currentDBMathesarTypes: Readable<MathesarType[]> =
  derived(
    [databasesToMathesarTypesStore, currentDBId],
    ([databasesToMathesarTypes, databaseId]) => {
      const mathesarTypes = databasesToMathesarTypes && databaseId
        ? databasesToMathesarTypes.get(databaseId)
        : undefined;
      return mathesarTypes;
    },
    undefined,
  );
