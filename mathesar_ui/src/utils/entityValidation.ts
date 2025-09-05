import type { Readable } from 'svelte/store';
import { get } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  EntityType,
  FavoriteItem,
  RecentItem,
} from '@mathesar/stores/favorites';
import { queries } from '@mathesar/stores/queries';
import { currentTablesData } from '@mathesar/stores/tables';

/**
 * Helper function to get schema name for a given schema OID and database ID
 */
async function getSchemaName(
  schemaOid: number,
  databaseId: number,
): Promise<string | undefined> {
  try {
    const schemas = await api.schemas.list({ database_id: databaseId }).run();
    const schema = schemas.find((s) => s.oid === schemaOid);
    return schema?.name;
  } catch (error) {
    console.warn(`Failed to fetch schema name for ${schemaOid}:`, error);
    return undefined;
  }
}

export interface ValidatedEntity {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
  name: string;
  schemaName?: string;
  exists: boolean;
}

export interface ValidationResult {
  validatedEntities: ValidatedEntity[];
  invalidEntityIds: Array<{
    entityType: EntityType;
    entityId: number;
    databaseId: number;
    schemaOid?: number;
  }>;
}

/**
 * Validates a single entity, first checking the existing stores (which are already cached),
 * then falling back to API calls if needed.
 */
async function validateSingleEntity(
  item: FavoriteItem | RecentItem,
): Promise<ValidatedEntity | null> {
  try {
    switch (item.entityType) {
      case 'table': {
        // Check tables store first
        const $tablesData = get(currentTablesData);
        if (
          $tablesData.databaseId === item.databaseId &&
          $tablesData.schemaOid === item.schemaOid
        ) {
          const table = $tablesData.tablesMap.get(item.entityId);
          if (table) {
            const schemaName = await getSchemaName(
              table.schema.oid,
              item.databaseId,
            );
            return {
              entityType: 'table',
              entityId: table.oid,
              databaseId: item.databaseId,
              schemaOid: table.schema.oid,
              name: table.name,
              schemaName,
              exists: true,
            };
          }
        }

        // Fall back to API call
        const table = await api.tables
          .get_with_metadata({
            database_id: item.databaseId,
            table_oid: item.entityId,
          })
          .run();
        const schemaName = await getSchemaName(table.schema, item.databaseId);
        return {
          entityType: 'table',
          entityId: table.oid,
          databaseId: item.databaseId,
          schemaOid: table.schema,
          name: table.name,
          schemaName,
          exists: true,
        };
      }

      case 'exploration': {
        // Check queries store first
        const $queries = get(queries);
        if (
          $queries.databaseId === item.databaseId &&
          $queries.schemaOid === item.schemaOid
        ) {
          const exploration = $queries.data.get(item.entityId);
          if (exploration) {
            const schemaName = await getSchemaName(
              exploration.schema_oid,
              exploration.database_id,
            );
            return {
              entityType: 'exploration',
              entityId: exploration.id,
              databaseId: exploration.database_id,
              schemaOid: exploration.schema_oid,
              name: exploration.name,
              schemaName,
              exists: true,
            };
          }
        }

        // Fall back to API call
        const exploration = await api.explorations
          .get({ exploration_id: item.entityId })
          .run();
        const schemaName = await getSchemaName(
          exploration.schema_oid,
          exploration.database_id,
        );
        return {
          entityType: 'exploration',
          entityId: exploration.id,
          databaseId: exploration.database_id,
          schemaOid: exploration.schema_oid,
          name: exploration.name,
          schemaName,
          exists: true,
        };
      }

      case 'form': {
        // For forms, we need to use API since there's no central forms store
        // and forms require both ID and schema context
        if (!item.schemaOid) {
          return null; // Can't validate forms without schema info
        }

        const forms = await api.forms
          .list({
            database_id: item.databaseId,
            schema_oid: item.schemaOid,
          })
          .run();

        const form = forms.find((f) => f.id === item.entityId);
        if (!form) {
          return null; // Form not found
        }

        const schemaName = await getSchemaName(
          form.schema_oid,
          form.database_id,
        );
        return {
          entityType: 'form',
          entityId: form.id,
          databaseId: form.database_id,
          schemaOid: form.schema_oid,
          name: form.name,
          schemaName,
          exists: true,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Entity validation failed for ${item.entityType} ${item.entityId}:`,
      error,
    );
    return null;
  }
}

/**
 * Validates multiple entities concurrently, returning both valid entities
 * and a list of invalid entity identifiers for cleanup.
 */
export async function validateEntities(
  items: (FavoriteItem | RecentItem)[],
): Promise<ValidationResult> {
  const validationPromises = items.map(async (item) => {
    const validated = await validateSingleEntity(item);
    return { item, validated };
  });

  const results = await Promise.all(validationPromises);

  const validatedEntities: ValidatedEntity[] = [];
  const invalidEntityIds: Array<{
    entityType: EntityType;
    entityId: number;
    databaseId: number;
    schemaOid?: number;
  }> = [];

  for (const { item, validated } of results) {
    if (validated) {
      validatedEntities.push(validated);
    } else {
      invalidEntityIds.push({
        entityType: item.entityType,
        entityId: item.entityId,
        databaseId: item.databaseId,
        schemaOid: item.schemaOid,
      });
    }
  }

  return { validatedEntities, invalidEntityIds };
}

/**
 * Helper function to create entity identifier key for lookups.
 */
export function createEntityKey(item: FavoriteItem | RecentItem): string {
  return `${item.entityType}-${item.entityId}-${item.databaseId}-${
    item.schemaOid ?? ''
  }`;
}

/**
 * Get validated entity data for a single item (used for display purposes)
 */
export async function getValidatedEntityData(
  item: FavoriteItem | RecentItem,
): Promise<{ name: string; schemaName?: string } | null> {
  const validated = await validateSingleEntity(item);
  if (validated) {
    return {
      name: validated.name,
      schemaName: validated.schemaName,
    };
  }
  return null;
}
