import { type Readable, derived, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import {
  type ValidationResult,
  validateEntities,
} from '@mathesar/utils/entityValidation';

import { databasesStore } from './databases';
import { LOCAL_STORAGE_KEYS } from './localStorage';
import LocalStorageStore from './LocalStorageStore';

export type EntityType = 'table' | 'form' | 'exploration';

interface BaseEntityItem {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}

export type FavoriteItem = BaseEntityItem;

export interface RecentItem extends BaseEntityItem {
  last_accessed_at: string;
}

// Enhanced items with display data
export interface FavoriteItemWithDisplayData {
  item: FavoriteItem;
  entityName: string;
  databaseName: string;
  schemaName?: string;
}

export interface RecentItemWithDisplayData {
  item: RecentItem;
  entityName: string;
  databaseName: string;
  schemaName?: string;
}

// Fallback to localStorage for favorites and recents when backend is not available
const localFavorites = new LocalStorageStore<FavoriteItem[]>({
  key: LOCAL_STORAGE_KEYS.favorites,
  defaultValue: [],
});

const localRecents = new LocalStorageStore<RecentItem[]>({
  key: LOCAL_STORAGE_KEYS.recents,
  defaultValue: [],
});

const MAX_RECENTS = 5;

const isLoading = writable(false);
const error = writable<string | null>(null);

// Display data stores
const favoritesWithDisplayData = writable<FavoriteItemWithDisplayData[]>([]);
const recentsWithDisplayData = writable<RecentItemWithDisplayData[]>([]);

// Use localStorage for favorites and recents (no backend API yet)
export const favorites: Readable<FavoriteItem[]> = localFavorites;
export const recents: Readable<RecentItem[]> = localRecents;

// Enhanced display data stores
export const favoritesWithDisplay: Readable<FavoriteItemWithDisplayData[]> =
  favoritesWithDisplayData;
export const recentsWithDisplay: Readable<RecentItemWithDisplayData[]> =
  recentsWithDisplayData;

export const favoritesLoading = derived(isLoading, (loading) => loading);
export const favoritesError = derived(error, (err) => err);

// Helper function to create entity key for identification
function createEntityKey(item: BaseEntityItem): string {
  return `${item.entityType}-${item.entityId}-${item.databaseId}-${
    item.schemaOid ?? ''
  }`;
}

// Helper function to create favorite/recent items
function createFavoriteItem(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}): FavoriteItem {
  return {
    ...params,
  };
}

function createRecentItem(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}): RecentItem {
  return {
    ...params,
    last_accessed_at: new Date().toISOString(),
  };
}

// Store functions (localStorage only for now)
function loadUserPreferences() {
  // Currently using localStorage only
  // TODO: Add backend API integration when endpoints are implemented
}

async function addFavorite(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}) {
  const newFavorite = createFavoriteItem(params);
  const currentFavorites = get(localFavorites);

  // Check if already favorited
  const exists = currentFavorites.some(
    (fav) =>
      fav.entityType === params.entityType &&
      fav.entityId === params.entityId &&
      fav.databaseId === params.databaseId,
  );

  if (!exists) {
    localFavorites.set([newFavorite, ...currentFavorites]);
  }
}

async function removeFavorite(
  entityType: EntityType,
  entityId: number,
  databaseId: number,
) {
  const currentFavorites = get(localFavorites);
  localFavorites.set(
    currentFavorites.filter(
      (fav) =>
        !(
          fav.entityType === entityType &&
          fav.entityId === entityId &&
          fav.databaseId === databaseId
        ),
    ),
  );
}

async function removeFavoriteByEntity(
  entityType: EntityType,
  entityId: number,
  databaseId: number,
) {
  const currentFavorites = get(localFavorites);
  localFavorites.set(
    currentFavorites.filter(
      (fav) =>
        !(
          fav.entityType === entityType &&
          fav.entityId === entityId &&
          fav.databaseId === databaseId
        ),
    ),
  );
}

async function addRecent(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}) {
  const newRecent = createRecentItem(params);

  function updateLocalRecents(newRecentItem: RecentItem) {
    const currentRecents = get(localRecents);

    // Remove if already exists (based on entity type, id, and database)
    const filtered = currentRecents.filter(
      (recent) =>
        !(
          recent.entityType === newRecentItem.entityType &&
          recent.entityId === newRecentItem.entityId &&
          recent.databaseId === newRecentItem.databaseId
        ),
    );

    // Add to beginning and limit to MAX_RECENTS
    const updated = [newRecentItem, ...filtered].slice(0, MAX_RECENTS);
    localRecents.set(updated);
  }

  updateLocalRecents(newRecent);
}

async function removeRecent(
  entityType: EntityType,
  entityId: number,
  databaseId: number,
) {
  const currentRecents = get(localRecents);
  localRecents.set(
    currentRecents.filter(
      (recent) =>
        !(
          recent.entityType === entityType &&
          recent.entityId === entityId &&
          recent.databaseId === databaseId
        ),
    ),
  );
}

async function clearRecents() {
  localRecents.set([]);
}

// Check if an item is favorited
function isFavorited(
  entityType: EntityType,
  entityId: number,
  databaseId: number,
): boolean {
  const currentFavorites = get(favorites);
  return currentFavorites.some(
    (fav) =>
      fav.entityType === entityType &&
      fav.entityId === entityId &&
      fav.databaseId === databaseId,
  );
}

// Validation and cleanup functions
async function validateAndCleanupFavorites(): Promise<ValidationResult> {
  const currentFavorites = get(localFavorites);
  const validationResult = await validateEntities(currentFavorites);

  // Remove invalid entities from favorites
  if (validationResult.invalidEntityIds.length > 0) {
    const validFavorites = currentFavorites.filter((fav) => {
      const key = createEntityKey(fav);
      return !validationResult.invalidEntityIds.some((invalid) => {
        const invalidKey = `${invalid.entityType}-${invalid.entityId}-${
          invalid.databaseId
        }-${invalid.schemaOid ?? ''}`;
        return key === invalidKey;
      });
    });
    localFavorites.set(validFavorites);
  }

  return validationResult;
}

async function validateAndCleanupRecents(): Promise<ValidationResult> {
  const currentRecents = get(localRecents);
  const validationResult = await validateEntities(currentRecents);

  // Remove invalid entities from recents
  if (validationResult.invalidEntityIds.length > 0) {
    const validRecents = currentRecents.filter((recent) => {
      const key = createEntityKey(recent);
      return !validationResult.invalidEntityIds.some((invalid) => {
        const invalidKey = `${invalid.entityType}-${invalid.entityId}-${
          invalid.databaseId
        }-${invalid.schemaOid ?? ''}`;
        return key === invalidKey;
      });
    });
    localRecents.set(validRecents);
  }

  return validationResult;
}

async function fetchDisplayData(): Promise<void> {
  const currentFavorites = get(localFavorites);
  const currentRecents = get(localRecents);

  // Deduplicate items that might exist in both favorites and recents
  const allItemsMap = new Map<string, FavoriteItem | RecentItem>();

  // Add favorites first
  currentFavorites.forEach((item) => {
    const key = createEntityKey(item);
    allItemsMap.set(key, item);
  });

  // Add recents, but don't overwrite if already exists
  currentRecents.forEach((item) => {
    const key = createEntityKey(item);
    if (!allItemsMap.has(key)) {
      allItemsMap.set(key, item);
    }
  });

  const allItems = Array.from(allItemsMap.values());

  if (allItems.length === 0) {
    favoritesWithDisplayData.set([]);
    recentsWithDisplayData.set([]);
    return;
  }

  try {
    isLoading.set(true);
    const { databases } = databasesStore;

    // Collect unique database and schema IDs to batch API calls
    const uniqueDatabaseIds = new Set(allItems.map((item) => item.databaseId));
    const uniqueSchemaIds = new Set(
      allItems
        .filter((item) => item.schemaOid)
        .map((item) => item.schemaOid as number),
    );

    // Batch fetch schemas for all unique database/schema combinations
    const schemaDataMap = new Map<string, string>(); // key: "databaseId-schemaOid", value: schema name

    const schemaPromises = Array.from(uniqueDatabaseIds).map(
      async (databaseId) => {
        try {
          const schemas = await api.schemas
            .list({ database_id: databaseId })
            .run();

          schemas.forEach((schema) => {
            if (uniqueSchemaIds.has(schema.oid)) {
              schemaDataMap.set(`${databaseId}-${schema.oid}`, schema.name);
            }
          });
        } catch (schemaError) {
          // eslint-disable-next-line no-console
          console.warn(
            `Failed to fetch schemas for database ${databaseId}:`,
            schemaError,
          );
        }
      },
    );

    await Promise.all(schemaPromises);

    // Now fetch entity data for each item
    const displayDataPromises = allItems.map(async (item) => {
      // Get database name from store
      const database = get(databases).get(item.databaseId);
      const databaseName = database?.name ?? `Database ${item.databaseId}`;

      // Get schema name from our batched data
      let schemaName: string | undefined;
      if (item.schemaOid) {
        schemaName =
          schemaDataMap.get(`${item.databaseId}-${item.schemaOid}`) ??
          `Schema ${item.schemaOid}`;
      }

      // Get entity name via API (fallback first)
      let entityName = `${
        item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)
      } ${item.entityId}`;

      try {
        // Fetch entity name based on type
        switch (item.entityType) {
          case 'table': {
            const table = await api.tables
              .get_with_metadata({
                database_id: item.databaseId,
                table_oid: item.entityId,
              })
              .run();
            entityName = table.name;
            break;
          }
          case 'exploration': {
            const exploration = await api.explorations
              .get({
                exploration_id: item.entityId,
              })
              .run();
            entityName = exploration.name;
            break;
          }
          case 'form': {
            if (item.schemaOid) {
              const forms = await api.forms
                .list({
                  database_id: item.databaseId,
                  schema_oid: item.schemaOid,
                })
                .run();
              const form = forms.find((f) => f.id === item.entityId);
              if (form) {
                entityName = form.name;
              }
            }
            break;
          }
          default:
            // Keep fallback name for unknown entity types
            break;
        }
      } catch (entityError) {
        // eslint-disable-next-line no-console
        console.warn(
          `Failed to fetch display data for ${item.entityType} ${item.entityId}:`,
          entityError,
        );
        // Keep fallback name
      }

      return {
        item,
        entityName,
        databaseName,
        schemaName,
      };
    });

    const allDisplayData = await Promise.all(displayDataPromises);

    // Split the results back into favorites and recents
    const favoritesDisplay = allDisplayData
      .filter((data) =>
        currentFavorites.some(
          (fav) =>
            fav.entityType === data.item.entityType &&
            fav.entityId === data.item.entityId &&
            fav.databaseId === data.item.databaseId,
        ),
      )
      .map((data) => ({ ...data, item: data.item }));

    const recentsDisplay = allDisplayData
      .filter((data) =>
        currentRecents.some(
          (recent) =>
            recent.entityType === data.item.entityType &&
            recent.entityId === data.item.entityId &&
            recent.databaseId === data.item.databaseId,
        ),
      )
      .map((data) => ({ ...data, item: data.item as RecentItem }));

    favoritesWithDisplayData.set(favoritesDisplay);
    recentsWithDisplayData.set(recentsDisplay);
    error.set(null);
  } catch (err) {
    console.error('Failed to fetch display data:', err);
    error.set('Failed to load display data');

    // Fallback to basic display data
    const { databases } = databasesStore;
    const fallbackFavorites = currentFavorites.map((item) => ({
      item,
      entityName: `${
        item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)
      } ${item.entityId}`,
      databaseName:
        get(databases).get(item.databaseId)?.name ??
        `Database ${item.databaseId}`,
      schemaName: item.schemaOid ? `Schema ${item.schemaOid}` : undefined,
    }));

    const fallbackRecents = currentRecents.map((item) => ({
      item,
      entityName: `${
        item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)
      } ${item.entityId}`,
      databaseName:
        get(databases).get(item.databaseId)?.name ??
        `Database ${item.databaseId}`,
      schemaName: item.schemaOid ? `Schema ${item.schemaOid}` : undefined,
    }));

    favoritesWithDisplayData.set(fallbackFavorites);
    recentsWithDisplayData.set(fallbackRecents);
  } finally {
    isLoading.set(false);
  }
}

async function validateAndCleanupAll(): Promise<{
  favoriteResults: ValidationResult;
  recentResults: ValidationResult;
}> {
  const [favoriteResults, recentResults] = await Promise.all([
    validateAndCleanupFavorites(),
    validateAndCleanupRecents(),
  ]);

  return { favoriteResults, recentResults };
}

// Export the favorites store and functions
export const favoritesStore = {
  subscribe: favorites.subscribe,
  load: loadUserPreferences,
  addFavorite,
  removeFavorite,
  removeFavoriteByEntity,
  addRecent,
  removeRecent,
  clearRecents,
  isFavorited,
  validateAndCleanupFavorites,
  validateAndCleanupRecents,
  validateAndCleanupAll,
  fetchDisplayData,
  refresh: validateAndCleanupAll, // Alias for explicit refresh
};

// Initialize localStorage mode
loadUserPreferences();
