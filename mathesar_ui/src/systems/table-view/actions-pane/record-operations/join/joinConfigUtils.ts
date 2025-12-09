import type {
  JoinPath,
  JoinableTable,
  JoinableTablesResult,
} from '@mathesar/api/rpc/tables';

/**
 * This represents a "simple" many-to-many relationship such that the mapping
 * table only contains FK columns for the mapping and does not contain any other
 * data. A common use case would be tagging.
 *
 * For example, if the current table is "movies", the target table could be
 * "genres" and the intermediate table could be "movie_genres".
 */
export interface SimpleManyToManyRelationship {
  currentTable: {
    oid: number;
    pkColumnAttnum: number;
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
  targetTable: {
    oid: number;
    name: string;
    /** Keys are stringified column attnum values */
    columns: {
      [key: string]: {
        name: string;
        type: string;
        primary_key: boolean;
      };
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
  const intermediateColumns = Object.values(intermediateInfo.columns);
  const countIntermediateColumns = intermediateColumns.length;

  if (countIntermediateColumns !== 3) return undefined;
  // Intermediate table must have exactly three columns

  const countIntermediatePkColumns = intermediateColumns.filter(
    (c) => c.primary_key,
  ).length;
  // Intermediate table must have exactly one PK column.
  if (countIntermediatePkColumns !== 1) return undefined;

  return {
    currentTable: {
      oid: joinableTable.join_path[0][0][0],
      pkColumnAttnum: joinableTable.join_path[0][0][1],
    },
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

export function getSimpleManyToManyJoinPath(
  relationship: SimpleManyToManyRelationship,
): JoinPath {
  const currentTableOid = relationship.currentTable.oid;
  const currentTablePkColumn = relationship.currentTable.pkColumnAttnum;
  const intermediateTableOid = relationship.intermediateTable.oid;
  const intermediateTableFkToCurrentColumn =
    relationship.intermediateTable.fkToCurrentTable.columnAttnum;
  const intermediateTableFkToTargetColumn =
    relationship.intermediateTable.fkToTargetTable.columnAttnum;
  const targetTableOid = relationship.targetTable.oid;

  // Find the primary key column in the target table
  const targetTablePkColumn = Object.entries(
    relationship.targetTable.columns,
  ).find(([, column]) => column.primary_key)?.[0];

  if (!targetTablePkColumn) {
    throw new Error(
      `Target table ${targetTableOid} does not have a primary key column`,
    );
  }

  return [
    [
      [currentTableOid, currentTablePkColumn],
      [intermediateTableOid, intermediateTableFkToCurrentColumn],
    ],
    [
      [intermediateTableOid, intermediateTableFkToTargetColumn],
      [targetTableOid, Number(targetTablePkColumn)],
    ],
  ];
}
