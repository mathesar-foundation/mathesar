import type { ComponentAndProps } from '@mathesar-component-library-dir/common/types/ComponentAndPropsTypes';
import { hasStringProperty } from './typeUtils';

export function formatSize(sizeInBytes: number): string {
  if (sizeInBytes === 0) {
    return '0 B';
  }

  /*
   * Currently we go with 1024 as the base. But some OS use 1000, including Mac.
   * TODO: Analyze on what is the best option to go with.
   */
  const repIndex = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  const repValue = sizeInBytes / 1024 ** repIndex;
  const repUnit = ' KMGTP'.charAt(repIndex);

  return `${repValue.toFixed(2)} ${repUnit}B`;
}

export type LabelGetter<Option> = (value: Option) => string | ComponentAndProps;

/**
 * If the given value has a label property and it is a string, return it.
 * Otherwise, return the value itself, converted to a string.
 */
export function getLabel(v: unknown, labelKey = 'label'): string {
  if (hasStringProperty(v, labelKey)) {
    return v[labelKey];
  }
  if (v === undefined) {
    return '';
  }
  return String(v);
}
