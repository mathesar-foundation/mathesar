import type { Database } from '@mathesar/App.d';
import { getAPI } from '@mathesar/utils/api';
import { intersection, pair, notEmpty } from '@mathesar/utils/language';
import { patchColumnType } from '@mathesar/stores/tableData';
import { derived } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { DatabaseStoreData } from '@mathesar/stores/databases';
import { databases, currentDBId } from '@mathesar/stores/databases';
import type { TableColumn } from '@mathesar/stores/tableData';

// TODO move to App.d.ts, next to Database
export type DbType = string;

export interface MathesarType {
  name: string,
  identifier: string,
  db_types: DbType[]
}

/**
 * Considers a DbType to belong to the first MathesarType that has it in its `db_types` set.
 */
export function determineMathesarType(
  mathesarTypes: MathesarType[],
  dbType: DbType,
): MathesarType {
  const mathesarTypeHasItAsTarget = (mt: MathesarType) => mt.db_types.includes(dbType);
  return mathesarTypes.find(mathesarTypeHasItAsTarget);
}

export function choosePreferredDbTypeTarget(
  mathesarType: MathesarType,
): DbType {
  switch (mathesarType.identifier) {
    case 'number':
      return 'NUMERIC';
    case 'text':
      return 'VARCHAR';
    default:
      throw new Error(`Database type target undefined for Mathesar type ${mathesarType.name}`);
  }
}

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

/**
 * Given a set of Database objects, queries the API for Mathesar types allowed on those databases
 * in parallel, and constructs a mapping between database ids and sets of those Mathesar types.
 */
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

/**
 * A Readable containing the output of calling getDatabasesToMathesarTypes on the database set
 * stored in the `databases` store.
 */
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

/**
 * A Readable containing the Mathesar types allowed on the database whose id is stored on
 * currentDBId.
 */
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

/**
 * We're creating a dummy subscription so that the number of subscribers does not drop to 0.
 * If it drops to 0, and then goes up to 1, the store will be invalidated and its callback
 * called unnecessarily. An invalidation in this case causes network IO.
 *
 * Dedicated issue: https://github.com/centerofci/mathesar/issues/670
 */
const dummySubscribe = (readable: Readable<unknown>) => readable.subscribe(() => {});
dummySubscribe(currentDBMathesarTypes);

export type DbTypeTargetsPerMathesarType = Map<MathesarType['identifier'], DbType[]>;

function getValidDbTypeTargetsForColumnAndMathesarType(
  column: TableColumn,
  mathesarType: MathesarType,
): DbType[] {
  return intersection(
    new Set(column.validTargetTypes),
    new Set(mathesarType.db_types),
  );
}

/**
 * Valid DbType target set for a given column and a given MathesarType is the intersection
 * between DbType targets defined on the MathesarType (as returned by the database REST API)
 * and DbType targets on the column (as returned by the column API).
 */
export function getValidDbTypeTargetsPerMathesarType(
  column: TableColumn,
  mathesarTypes: MathesarType[],
): DbTypeTargetsPerMathesarType {
  const pairs = mathesarTypes.map(
    (mathesarType) => pair(
      mathesarType.identifier,
      getValidDbTypeTargetsForColumnAndMathesarType(column, mathesarType),
    ),
  );
  return new Map(pairs);
}

export function mathesarTypeHasAtLeastOneValidDbTypeTarget(
  validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
  mathesarType: MathesarType,
): boolean {
  // eslint-disable-next-line operator-linebreak
  const validDbTypeTargets =
    validDbTypeTargetsPerMathesarType.get(mathesarType.identifier);
  const atLeastOne = notEmpty(validDbTypeTargets);
  return atLeastOne;
}

export function patchColumnToMathesarType(
  // as returned by createEventDispatcher()
  dispatch: (x: unknown) => void,
  tableId: number,
  columnId: number,
  validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
  mathesarType: MathesarType,
): void {
  if (validDbTypeTargetsPerMathesarType) {
    const newDbType = choosePreferredDbTypeTarget(mathesarType);
    const reloadTable = () => dispatch('reload');
    void patchColumnType(tableId, columnId, newDbType)
      .then(reloadTable);
  }
}
