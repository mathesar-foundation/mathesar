import { get } from 'svelte/store';

import type { IconProps } from '@mathesar-component-library/types';
import type { DisplayColumn } from '@mathesar/components/column/types';
import { iconConstraint, iconTableLink } from '@mathesar/icons';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';

export function getColumnIconProps(
  _column: DisplayColumn,
): IconProps | IconProps[] {
  if (_column.constraintsType?.includes('primary')) {
    return iconConstraint;
  }

  if (_column.constraintsType?.includes('foreignkey')) {
    return iconTableLink;
  }

  return getAbstractTypeForDbType(
    _column.type,
    get(currentDbAbstractTypes)?.data,
  ).getIcon({
    dbType: _column.type,
    typeOptions: _column.type_options,
  });
}
