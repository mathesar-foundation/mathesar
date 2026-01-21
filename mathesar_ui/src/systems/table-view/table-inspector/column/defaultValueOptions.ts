import { DB_TYPES } from '@mathesar/stores/abstract-types/dbTypes';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export type DefaultValueMode =
  | 'none'
  | 'auto_set_editor'
  | 'set_default_user'
  | 'custom';

export interface DefaultValueOptions {
  /** Available modes for this column type */
  availableModes: DefaultValueMode[];
  /** The initial mode based on column state */
  initialMode: DefaultValueMode;
  /** Label for the custom/default value option */
  customValueLabel: string;
  /** Whether this column type supports metadata updates on save */
  supportsMetadataUpdate: boolean;
  /** Function to get metadata updates when saving (if supportsMetadataUpdate is true) */
  getMetadataUpdate?: (
    mode: DefaultValueMode,
  ) => Record<string, unknown> | null;
}

/**
 * Get default value options for a column based on its type.
 * This allows type-specific logic to be handled separately from the generic component.
 */
export function getDefaultValueOptions(
  column: ProcessedColumn,
): DefaultValueOptions {
  const isUserColumn =
    column.column.type === DB_TYPES.INTEGER &&
    column.column.metadata?.user_display_field != null;

  if (isUserColumn) {
    const initialIsTrackEditingUser =
      column.column.metadata?.track_editing_user ?? false;
    const initialIsDefaultNull = column.column.default === null;

    let initialMode: DefaultValueMode;
    if (initialIsTrackEditingUser) {
      initialMode = 'auto_set_editor';
    } else if (initialIsDefaultNull) {
      initialMode = 'none';
    } else {
      initialMode = 'set_default_user';
    }

    return {
      availableModes: ['none', 'auto_set_editor', 'set_default_user'],
      initialMode,
      customValueLabel: 'default_value_set_default_user',
      supportsMetadataUpdate: true,
      getMetadataUpdate: (mode) => ({
        track_editing_user: mode === 'auto_set_editor',
      }),
    };
  }

  // For non-user types, use the standard options
  const initialIsDefaultNull = column.column.default === null;
  return {
    availableModes: ['none', 'custom'],
    initialMode: initialIsDefaultNull ? 'none' : 'custom',
    customValueLabel: 'custom_default',
    supportsMetadataUpdate: false,
  };
}
