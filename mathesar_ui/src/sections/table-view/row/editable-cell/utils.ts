import { get } from 'svelte/store';
import type {
  Column,
} from '@mathesar/stores/table-data/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { ConditionalPropsForDbType } from '@mathesar/stores/abstract-types/types.d';

export function getConditionalProps(column: Column): ConditionalPropsForDbType {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.input.conditionalProps?.[column.type] ?? {};
}

export function getInputAttributes(column: Column): Record<string, string> {
  const typeOptions = column.type_options;
  const attributes: Record<string, string> = {};
  if (typeOptions) {
    if ('length' in typeOptions && typeOptions.length !== null) {
      attributes.maxlength = typeOptions.length as string;
    }
    // Future attributes will be placed here
  }
  return attributes;
}

export function getClasses(column: Column): string {
  const classes = ['cell', 'editable-cell'];
  const props = getConditionalProps(column);

  if ('size' in props) {
    classes.push(`size-${props.size as string}`);
  }

  return classes.join(' ');
}
