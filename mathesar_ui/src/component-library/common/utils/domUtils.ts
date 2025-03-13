import { isDefinedNonNullable } from './typeUtils';

const contextMap = new Map<string, number>();

export function getGloballyUniqueId(context = 'global'): string {
  const idPrefix = `_${context}-id`;

  // randomUUID is only present in secure contexts such as https
  if (crypto && crypto.randomUUID) {
    return `${idPrefix}-${crypto.randomUUID()}`;
  }

  let counter = contextMap.get(context);
  if (!isDefinedNonNullable(counter)) {
    counter = 0;
  }
  counter += 1;
  contextMap.set(context, counter);

  return `${idPrefix}-${counter}`;
}
