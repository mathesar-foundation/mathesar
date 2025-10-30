import { type Readable, derived, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import {
  type ResolutionResult,
  resolveEntityRefs,
  createEntityKey,
} from '@mathesar/utils/entityResolution';

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

// Use localStorage for favorites and recents
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

// Export readable stores
export const favorites: Readable<FavoriteItem[]> = localFavorites;
export const recents: Readable<RecentItem[]> = localRecents;

// Enhanced display data stores
export const favoritesWithDisplay: Readable<FavoriteItemWithDisplayData[]> =
  favoritesWithDisplayData;
export const recentsWithDisplay: Readable<RecentItemWithDisplayData[]> =
  recentsWithDisplayData;

export const favoritesLoading = derived(isLoading, (loading) => loading);
export const favoritesError = derived(error, (err) => err);

// Using shared helper from utils/entityResolution for entity keys

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

async function addFavorite(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}) {
  if (params.entityType === 'form' && params.schemaOid == null) {
    // Forms require schema context; ignore invalid input
    // eslint-disable-next-line no-console
    console.warn('addFavorite: schemaOid is required for forms; skipping');
    return;
  }
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

async function addRecent(params: {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
}) {
  if (params.entityType === 'form' && params.schemaOid == null) {
    // Forms require schema context; ignore invalid input
    // eslint-disable-next-line no-console
    console.warn('addRecent: schemaOid is required for forms; skipping');
    return;
  }
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
async function validateAndCleanupFavorites(): Promise<ResolutionResult> {
  const currentFavorites = get(localFavorites);
  const validationResult = await resolveEntityRefs(currentFavorites);

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

async function validateAndCleanupRecents(): Promise<ResolutionResult> {
  const currentRecents = get(localRecents);
  const validationResult = await resolveEntityRefs(currentRecents);

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

    const { resolvedEntities } = await resolveEntityRefs(allItems);
    const resolvedByKey = new Map<string, typeof resolvedEntities[number]>();
    for (const r of resolvedEntities) {
      resolvedByKey.set(
        createEntityKey({
          entityType: r.entityType,
          entityId: r.entityId,
          databaseId: r.databaseId,
          schemaOid: r.schemaOid,
        }),
        r,
      );
    }

    const allDisplayData = allItems.map((item) => {
      const key = createEntityKey(item);
      const resolved = resolvedByKey.get(key);
      const database = get(databases).get(item.databaseId);
      const databaseName = database?.name ?? `Database ${item.databaseId}`;
      const entityName = resolved
        ? resolved.name
        : `${item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)} ${
            item.entityId
          }`;
      return {
        item,
        entityName,
        databaseName,
        schemaName: resolved?.schemaName ?? (item.schemaOid ? `Schema ${item.schemaOid}` : undefined),
      };
    });

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
      .map((data) => ({
        ...data,
        item: {
          ...(data.item as RecentItem),
          last_accessed_at:
            currentRecents.find(
              (r) =>
                r.entityType === data.item.entityType &&
                r.entityId === data.item.entityId &&
                r.databaseId === data.item.databaseId,
            )?.last_accessed_at ?? new Date().toISOString(),
        },
      }));

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

// Auto-derive display data from base favorites/recents
// This triggers whenever favorites or recents change
// and keeps the display stores in sync without manual refresh calls
// Note: Uses the same logic as fetchDisplayData
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _autoDisplayDeriver = derived([favorites, recents], ([$favorites, $recents]) => {
  void (async () => {
    const currentFavorites = $favorites;
    const currentRecents = $recents;

    const allItemsMap = new Map<string, FavoriteItem | RecentItem>();
    currentFavorites.forEach((item) => {
      const key = createEntityKey(item);
      allItemsMap.set(key, item);
    });
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
      const { resolvedEntities } = await resolveEntityRefs(allItems);
      const resolvedByKey = new Map<string, typeof resolvedEntities[number]>();
      for (const r of resolvedEntities) {
        resolvedByKey.set(
          createEntityKey({
            entityType: r.entityType,
            entityId: r.entityId,
            databaseId: r.databaseId,
            schemaOid: r.schemaOid,
          }),
          r,
        );
      }

      const allDisplayData = allItems.map((item) => {
        const key = createEntityKey(item);
        const resolved = resolvedByKey.get(key);
        const database = get(databases).get(item.databaseId);
        const databaseName = database?.name ?? `Database ${item.databaseId}`;
        const entityName = resolved
          ? resolved.name
          : `${item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)} ${
              item.entityId
            }`;
        return {
          item,
          entityName,
          databaseName,
          schemaName:
            resolved?.schemaName ?? (item.schemaOid ? `Schema ${item.schemaOid}` : undefined),
        };
      });

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
        .map((data) => ({
          ...data,
          item: {
            ...(data.item as RecentItem),
            last_accessed_at:
              currentRecents.find(
                (r) =>
                  r.entityType === data.item.entityType &&
                  r.entityId === data.item.entityId &&
                  r.databaseId === data.item.databaseId,
              )?.last_accessed_at ?? new Date().toISOString(),
          },
        }));

      favoritesWithDisplayData.set(favoritesDisplay);
      recentsWithDisplayData.set(recentsDisplay);
      error.set(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to derive display data:', err);
      error.set('Failed to load display data');
    } finally {
      isLoading.set(false);
    }
  })();
});

// Ensure the derived computation is active
const __autoDisplayDeriverSubscription = _autoDisplayDeriver.subscribe(() => {});

async function validateAndCleanupAll(): Promise<{
  favoriteResults: ResolutionResult;
  recentResults: ResolutionResult;
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
  addFavorite,
  removeFavorite,
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
