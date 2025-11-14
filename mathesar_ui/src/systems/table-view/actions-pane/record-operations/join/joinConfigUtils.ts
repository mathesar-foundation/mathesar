import type {
  JoinableTable,
  JoinableTablesResult,
} from '@mathesar/api/rpc/tables';

/**
 * This represents a "simple" many-to-many relationship such that the mapping
 * table only contains FK columns for the mapping and does not contain any other
 * data. A common use case would be tagging.
 *
 * The relationship is taken from the context of the "current" table, which is
 * not represented in this data structure.
 *
 * For example, if the current table is "movies", the target table could be
 * "genres" and the intermediate table could be "movie_genres".
 */
export interface SimpleManyToManyRelationship {
  targetTable: {
    oid: number;
    name: string;
    /** Keys are stringified column attnum values */
    columns: {
      [key: string]: {
        name: string;
        type: string;
      };
    };
  };
  intermediateTable: {
    oid: number;
    name: string;
    /** Keys are stringified column attnum values */
    columns: {
      [key: string]: {
        name: string;
        type: string;
      };
    };
    fkToCurrentTable: {
      constraintOid: number;
      columnAttnum: number;
    };
    fkToTargetTable: {
      constraintOid: number;
      columnAttnum: number;
    };
  };
}

function buildSimpleManyToManyRelationship(
  joinableTable: JoinableTable,
  targetTableInfo: JoinableTablesResult['target_table_info'],
): SimpleManyToManyRelationship | undefined {
  // Depth must be 2 for a simple many-to-many relationship
  if (joinableTable.depth !== 2) return undefined;

  const path = joinableTable.fkey_path;
  // First join must be backwards FK
  if (path.at(0)?.at(1) !== true) return undefined;
  // Second join must be forward FK
  if (path.at(1)?.at(1) !== false) return undefined;

  const targetOid = joinableTable.target;
  const targetInfo = targetTableInfo[joinableTable.target];

  const intermediateOid = joinableTable.join_path[0][1][0];
  const intermediateInfo = targetTableInfo[intermediateOid];
  const countIntermediateNonPkColumns = Object.values(
    intermediateInfo.columns,
  ).filter((c) => !c.primary_key).length;
  // Intermediate table must have exactly two non-PK columns. We already know
  // these will be FK columns based on the previous validations of fkey_path.
  if (countIntermediateNonPkColumns !== 2) return undefined;

  return {
    targetTable: { oid: targetOid, ...targetInfo },
    intermediateTable: {
      oid: intermediateOid,
      ...intermediateInfo,
      fkToCurrentTable: {
        constraintOid: joinableTable.fkey_path[0][0],
        columnAttnum: joinableTable.join_path[0][1][1],
      },
      fkToTargetTable: {
        constraintOid: joinableTable.fkey_path[1][0],
        columnAttnum: joinableTable.join_path[1][0][1],
      },
    },
  };
}

function* generateSimpleManyToManyRelationships(
  joinableTablesResult: JoinableTablesResult,
): Generator<SimpleManyToManyRelationship> {
  for (const joinableTable of joinableTablesResult.joinable_tables) {
    const r = buildSimpleManyToManyRelationship(
      joinableTable,
      joinableTablesResult.target_table_info,
    );
    if (r) yield r;
  }
}

export function getSimpleManyToManyRelationships(
  joinableTablesResult: JoinableTablesResult,
): SimpleManyToManyRelationship[] {
  return [...generateSimpleManyToManyRelationships(joinableTablesResult)].sort(
    (a, b) => a.targetTable.name.localeCompare(b.targetTable.name),
  );
}
