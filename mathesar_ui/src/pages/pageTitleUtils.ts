import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { currentSchema } from '@mathesar/stores/schemas';

const SEPARATOR = ' | ';

function makePageTitle(parts: string[]): string {
  const schema = get(currentSchema);
  const allParts = [...parts];
  if (schema) {
    allParts.push(schema.name);
  }
  allParts.push(get(_)('mathesar'));
  return allParts.join(SEPARATOR);
}

export function makeSimplePageTitle(str: string): string {
  return makePageTitle([str]);
}
