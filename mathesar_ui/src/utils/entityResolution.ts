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
 * Cache for schema names to avoid redundant API calls during batch resolution.
 * Key format: `${databaseId}-${schemaOid}`
 */
class SchemaNameCache {
  private cache = new Map<string, string | undefined>();

  private getCacheKey(databaseId: number, schemaOid: number): string {
    return `${databaseId}-${schemaOid}`;
  }

  async get(
    schemaOid: number,
    databaseId: number,
  ): Promise<string | undefined> {
    const key = this.getCacheKey(databaseId, schemaOid);

    // Return cached value if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fetch and cache
    try {
      const schemas = await api.schemas
        .list({ database_id: databaseId })
        .run();
      const schema = schemas.find((s) => s.oid === schemaOid);
      const schemaName = schema?.name;
      this.cache.set(key, schemaName);
      return schemaName;
    } catch (error) {
      console.warn(`Failed to fetch schema name for ${schemaOid}:`, error);
      this.cache.set(key, undefined);
      return undefined;
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Represents a successfully resolved entity with its metadata.
 * Used for both validation (checking existence) and enrichment (displaying info).
 */
export interface ResolvedEntity {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
  name: string;
  schemaName?: string;
  exists: boolean;
}

/**
 * Result of resolving multiple entities, separating valid from invalid references.
 */
export interface ResolutionResult {
  resolvedEntities: ResolvedEntity[];
  invalidEntityIds: Array<{
    entityType: EntityType;
    entityId: number;
    databaseId: number;
    schemaOid?: number;
  }>;
}

/**
 * @deprecated Use ResolutionResult instead
 */
export type ValidationResult = ResolutionResult;

/**
 * @deprecated Use ResolvedEntity instead
 */
export type ValidatedEntity = ResolvedEntity;

/**
 * Resolves a single entity reference, checking stores first then falling back to API.
 * Returns entity metadata if found, null if invalid or deleted.
 */
async function resolveSingleEntity(
  item: FavoriteItem | RecentItem,
  schemaCache: SchemaNameCache,
): Promise<ResolvedEntity | null> {
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
            const schemaName = await schemaCache.get(
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
        const schemaName = await schemaCache.get(table.schema, item.databaseId);
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
            const schemaName = await schemaCache.get(
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
        const schemaName = await schemaCache.get(
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

        const schemaName = await schemaCache.get(
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
 * Resolves multiple entities concurrently with schema name caching.
 * Returns both successfully resolved entities and invalid entity identifiers for cleanup.
 */
export async function resolveEntityRefs(
  items: (FavoriteItem | RecentItem)[],
): Promise<ResolutionResult> {
  const schemaCache = new SchemaNameCache();

  const resolutionPromises = items.map(async (item) => {
    const resolved = await resolveSingleEntity(item, schemaCache);
    return { item, resolved };
  });

  const results = await Promise.all(resolutionPromises);

  const resolvedEntities: ResolvedEntity[] = [];
  const invalidEntityIds: Array<{
    entityType: EntityType;
    entityId: number;
    databaseId: number;
    schemaOid?: number;
  }> = [];

  for (const { item, resolved } of results) {
    if (resolved) {
      resolvedEntities.push(resolved);
    } else {
      invalidEntityIds.push({
        entityType: item.entityType,
        entityId: item.entityId,
        databaseId: item.databaseId,
        schemaOid: item.schemaOid,
      });
    }
  }

  return { resolvedEntities, invalidEntityIds };
}

/**
 * @deprecated Use resolveEntityRefs instead
 */
export async function validateEntities(
  items: (FavoriteItem | RecentItem)[],
): Promise<ValidationResult> {
  return resolveEntityRefs(items);
}

/**
 * Resolves a single entity and returns just the display information.
 * Useful for UI components that only need name and schema.
 */
export async function getEntityDisplayInfo(
  item: FavoriteItem | RecentItem,
): Promise<{ name: string; schemaName?: string } | null> {
  const schemaCache = new SchemaNameCache();
  const resolved = await resolveSingleEntity(item, schemaCache);
  if (resolved) {
    return {
      name: resolved.name,
      schemaName: resolved.schemaName,
    };
  }
  return null;
}

/**
 * @deprecated Use getEntityDisplayInfo instead
 */
export async function getValidatedEntityData(
  item: FavoriteItem | RecentItem,
): Promise<{ name: string; schemaName?: string } | null> {
  return getEntityDisplayInfo(item);
}

export function createEntityKey(item: FavoriteItem | RecentItem): string {
  return `${item.entityType}-${item.entityId}-${item.databaseId}-${
    item.schemaOid ?? ''
  }`;
}
