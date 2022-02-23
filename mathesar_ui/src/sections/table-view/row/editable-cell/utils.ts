import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type {
  ConditionalPropsForDbType,
  AbstractTypeConfiguration,
} from '@mathesar/stores/abstract-types/types.d';

function getInputConfiguration(
  column: Column,
): AbstractTypeConfiguration['input'] {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.input ?? null;
}

function getConditionalProps(column: Column): ConditionalPropsForDbType {
  return getInputConfiguration(column)?.conditionalProps?.[column.type] ?? {};
}

function getSize(column: Column): string | null {
  const props = getConditionalProps(column);
  const typeOptions = column.type_options;

  if ('size' in props) {
    const size = props.size as string;
    if (size.indexOf('auto') === 0) {
      if (
        !typeOptions ||
        typeOptions.length === null ||
        (typeOptions.length as number) > 255
      ) {
        return 'large';
      }
    } else {
      return size;
    }
  }

  return null;
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

  const size = getSize(column);
  if (size) {
    classes.push(`size-${size}`);
  }

  return classes.join(' ');
}

export function getInputProps(column: Column): Record<string, unknown> {
  const inputOptions = getInputConfiguration(column);
  const props: Record<string, unknown> = {
    // TODO: Set datatype based on input option type
    // dataType: inputOptions.type ?? 'string',
    dataType: 'string',
  };
  if (inputOptions.type === 'string') {
    const size = getSize(column);
    if (size === 'large') {
      props.interfaceType = 'textarea';
    }
  }
  return props;
}
