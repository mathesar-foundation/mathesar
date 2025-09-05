import { iconTable, iconForm, iconExploration } from '@mathesar/icons';
import type { IconProps } from '@mathesar-component-library/types';
import {
  getDatabasePageUrl,
  getSchemaPageUrl,
  getTablePageUrl,
  getExplorationPageUrl,
  getDataFormPageUrl,
} from '@mathesar/routes/urls';
import type { EntityType } from '@mathesar/stores/favorites';

/**
 * Get the appropriate icon for an entity type
 */
export function getEntityIcon(entityType: EntityType): IconProps {
  switch (entityType) {
    case 'table':
      return iconTable;
    case 'form':
      return iconForm;
    case 'exploration':
      return iconExploration;
    default:
      return iconTable;
  }
}

/**
 * Get the URL for an entity based on its type and properties
 */
export function getEntityUrl(
  entityType: EntityType,
  entityId: number,
  databaseId: number,
  schemaOid?: number,
): string {
  switch (entityType) {
    case 'table':
      return getTablePageUrl(databaseId, schemaOid!, entityId);
    case 'form':
      return getDataFormPageUrl(databaseId, schemaOid!, entityId);
    case 'exploration':
      return getExplorationPageUrl(databaseId, schemaOid!, entityId);
    default:
      return getDatabasePageUrl(databaseId);
  }
}
