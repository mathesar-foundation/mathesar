import type { JoinPath } from '@mathesar/api/rpc/tables';

export interface IntermediateTableInfo {
  intermediateTableOid: number;
  fkToBaseAttnum: number;
  fkToTargetAttnum: number;
}

/**
 * Extract intermediate table information from a join path for many-to-many relationships.
 *
 * For a many-to-many relationship, the join path has 2 steps:
 * - Step 1: [[base_table_oid, base_pk_attnum], [intermediate_table_oid, fk_to_base_attnum]]
 * - Step 2: [[intermediate_table_oid, fk_to_target_attnum], [target_table_oid, target_pk_attnum]]
 *
 * @param joinPath The join path from base table to target table
 * @param baseTableOid The OID of the base table
 * @param targetTableOid The OID of the target table
 * @returns Intermediate table info if this is a many-to-many relationship, null otherwise
 */
export function extractIntermediateTableInfo(
  joinPath: JoinPath,
  baseTableOid: number,
  targetTableOid: number,
): IntermediateTableInfo | null {
  // Many-to-many relationships have exactly 2 steps in the join path
  if (
    joinPath.length !== 2 ||
    joinPath[0].length !== 2 ||
    joinPath[1].length !== 2
  ) {
    return null;
  }

  const [[baseSide, intermediateSide], [intermediateSide2, targetSide]] =
    joinPath;

  // Validate step 1: should connect base table to intermediate table
  // Validate step 2: should connect intermediate table to target table
  // Verify both steps reference the same intermediate table
  const intermediateTableOid = intermediateSide[0];
  if (
    baseSide[0] !== baseTableOid ||
    targetSide[0] !== targetTableOid ||
    intermediateTableOid !== intermediateSide2[0]
  ) {
    return null;
  }

  return {
    intermediateTableOid,
    fkToBaseAttnum: intermediateSide[1], // FK column in intermediate table pointing to base
    fkToTargetAttnum: intermediateSide2[1], // FK column in intermediate table pointing to target
  };
}
