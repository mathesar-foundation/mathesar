import { DB_TYPES } from '@mathesar/stores/abstract-types/dbTypes';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export type DefaultValueMode = 'none' | 'set_default_user' | 'custom';

export interface DefaultValueOptions {
  /** Available modes for this column type */
  availableModes: DefaultValueMode[];
  /** The initial mode based on column state */
  initialMode: DefaultValueMode;
  /** Label for the custom/default value option */
  customValueLabel: string;
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
    const initialIsDefaultNull = column.column.default === null;
    return {
      availableModes: ['none', 'set_default_user'],
      initialMode: initialIsDefaultNull ? 'none' : 'set_default_user',
      customValueLabel: 'default_value_set_default_user',
    };
  }

  // For non-user types, use the standard options
  const initialIsDefaultNull = column.column.default === null;
  return {
    availableModes: ['none', 'custom'],
    initialMode: initialIsDefaultNull ? 'none' : 'custom',
    customValueLabel: 'custom_default',
  };
}
