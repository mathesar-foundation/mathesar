import { type EntityType, favoritesStore } from '@mathesar/stores/favorites';

export interface TrackRecentParams {
  entityType: EntityType;
  entityId: number;
  databaseId: number;
  schemaOid?: number;
  entityName?: string;
  entityDescription?: string;
}

/**
 * Track a recent visit to an entity (table, form, or exploration)
 */
export async function trackRecentVisit(
  params: TrackRecentParams,
): Promise<void> {
  try {
    // Enforce schemaOid for forms
    if (params.entityType === 'form' && params.schemaOid == null) {
      // eslint-disable-next-line no-console
      console.warn('trackRecentVisit: schemaOid is required for forms; skipping');
      return;
    }
    await favoritesStore.addRecent({
      entityType: params.entityType,
      entityId: params.entityId,
      databaseId: params.databaseId,
      schemaOid: params.schemaOid,
    });
  } catch (error) {
    // Silently fail for recent tracking to not interrupt user experience
    // eslint-disable-next-line no-console
    console.warn('Failed to track recent visit:', error);
  }
}

/**
 * Svelte action to automatically track recent visits when a page mounts
 */
export function trackRecent(
  node: HTMLElement,
  params: TrackRecentParams | undefined,
) {
  // Only track if params are provided and have required fields
  if (params && params.entityId && params.databaseId) {
    // Track the visit when the element mounts
    void trackRecentVisit(params);
  }

  return {
    // Update tracking if parameters change
    update(newParams: TrackRecentParams | undefined) {
      if (newParams && newParams.entityId && newParams.databaseId) {
        void trackRecentVisit(newParams);
      }
    },
  };
}
