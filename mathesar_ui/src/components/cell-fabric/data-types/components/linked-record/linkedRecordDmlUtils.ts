import { api } from '@mathesar/api/rpc';
import type { SqlExpr } from '@mathesar/api/rpc/records';

/**
 * Utilities for managing many-to-many relationships through intermediate (junction) tables.
 * These functions handle DML operations (add/remove) for linked records.
 *
 * TODO: Current implementation assumes junction tables have a single primary key column.
 * This works for tables with surrogate PKs but will fail for tables with composite PKs
 * (i.e., PK composed of the two FK columns). The delete operation tries to find a single
 * PK column and delete by its value, which won't work with composite keys. Consider
 * refactoring to use filtered deletes instead of deleting by PK, which would work with
 * both composite and surrogate PKs. Or use one and and fall back to the other.
 */

/**
 * Get the primary key column attnum for an intermediate table
 */
async function getIntermediateTablePkAttnum(
  databaseId: number,
  intermediateTableOid: number,
): Promise<number | null> {
  try {
    const columns = await api.columns
      .list({
        database_id: databaseId,
        table_oid: intermediateTableOid,
      })
      .run();
    const pkColumn = columns.find(
      (col: { primary_key?: boolean; id: number }) => col.primary_key,
    );
    return pkColumn ? pkColumn.id : null;
  } catch {
    return null;
  }
}

/**
 * Find intermediate table records matching both foreign keys
 * Returns an array of primary key values for the intermediate table records
 */
export async function findIntermediateTableRecords(
  databaseId: number,
  intermediateTableOid: number | undefined,
  fkToBaseAttnum: number | undefined,
  fkToTargetAttnum: number | undefined,
  baseTableRowPk: unknown,
  targetRecordId: string | number,
): Promise<(string | number)[]> {
  if (
    !intermediateTableOid ||
    !fkToBaseAttnum ||
    !fkToTargetAttnum ||
    !baseTableRowPk
  ) {
    return [];
  }

  try {
    const pkAttnum = await getIntermediateTablePkAttnum(
      databaseId,
      intermediateTableOid,
    );
    if (!pkAttnum) return [];

    // Build filter: fkToBase = baseTableRowPk AND fkToTarget = targetRecordId
    const filter: SqlExpr = {
      type: 'and',
      args: [
        {
          type: 'equal',
          args: [
            { type: 'attnum', value: fkToBaseAttnum },
            {
              type: 'literal',
              value: baseTableRowPk as string | number | null,
            },
          ],
        },
        {
          type: 'equal',
          args: [
            { type: 'attnum', value: fkToTargetAttnum },
            { type: 'literal', value: targetRecordId },
          ],
        },
      ],
    };

    const response = await api.records
      .list({
        database_id: databaseId,
        table_oid: intermediateTableOid,
        filter,
        limit: 1000, // Should be enough for junction table records
      })
      .run();

    // Extract PK values from results, filtering out null/boolean values
    return response.results
      .map((record: Record<string, unknown>) => record[String(pkAttnum)])
      .filter(
        (id: unknown): id is string | number =>
          id !== null && id !== undefined && typeof id !== 'boolean',
      );
  } catch (error) {
    console.error('Error finding intermediate table records:', error);
    return [];
  }
}

/**
 * Add records to intermediate table
 * Creates junction table records linking base table row to target records
 */
export async function addIntermediateTableRecords(
  databaseId: number,
  intermediateTableOid: number | undefined,
  fkToBaseAttnum: number | undefined,
  fkToTargetAttnum: number | undefined,
  baseTableRowPk: unknown,
  targetRecordIds: (string | number)[],
): Promise<void> {
  if (
    !intermediateTableOid ||
    !fkToBaseAttnum ||
    !fkToTargetAttnum ||
    !baseTableRowPk
  ) {
    return;
  }

  try {
    // Insert each new record
    for (const targetRecordId of targetRecordIds) {
      const recordDef = {
        [String(fkToBaseAttnum)]: baseTableRowPk,
        [String(fkToTargetAttnum)]: targetRecordId,
      };
      await api.records
        .add({
          database_id: databaseId,
          table_oid: intermediateTableOid,
          record_def: recordDef,
        })
        .run();
    }
  } catch (error) {
    console.error('Error adding intermediate table records:', error);
    throw error;
  }
}

/**
 * Remove records from intermediate table
 * Deletes junction table records linking base table row to a target record
 */
export async function removeIntermediateTableRecords(
  databaseId: number,
  intermediateTableOid: number | undefined,
  fkToBaseAttnum: number | undefined,
  fkToTargetAttnum: number | undefined,
  baseTableRowPk: unknown,
  targetRecordId: string | number,
): Promise<void> {
  if (!intermediateTableOid) {
    return;
  }

  try {
    const intermediateRecordIds = await findIntermediateTableRecords(
      databaseId,
      intermediateTableOid,
      fkToBaseAttnum,
      fkToTargetAttnum,
      baseTableRowPk,
      targetRecordId,
    );
    if (intermediateRecordIds.length === 0) {
      return;
    }

    await api.records
      .delete({
        database_id: databaseId,
        table_oid: intermediateTableOid,
        record_ids: intermediateRecordIds,
      })
      .run();
  } catch (error) {
    console.error('Error removing intermediate table records:', error);
    throw error;
  }
}
